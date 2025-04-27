"use client";
// app/components/ChatWorkspace.tsx

import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { getAIResponse } from "@/utils/api";
import { ChatBubble } from "@/app/components/ChatBubble";

// Helper functions for Supabase
export async function fetchChatMessages(caseId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function sendChatMessage(
  caseId: string,
  sender: "user" | "assistant",
  content: string
) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([
      {
        case_id: caseId,
        sender,
        content,
        created_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function fetchDocumentSummaries(caseId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("summary")
    .eq("case_id", caseId);

  if (error) throw error;

  return data.map((doc) => doc.summary).filter((s) => s);
}

// Helper to roughly estimate tokens from words
function estimateTokens(text: string) {
  return Math.ceil(text.split(/\s+/).length * 1.33);
}

// Added new function to clear chat messages for a specific case
export async function clearChatMessages(caseId: string) {
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("case_id", caseId);

  if (error) {
    throw error;
  }

  return true;
}

// Interface definitions
interface ChatMessage {
  id: string;
  case_id: string;
  sender: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatWorkspaceProps {
  userId: string;
  caseId: string;
}

// Define the interface for the imperative methods
export interface ChatWorkspaceHandle {
  sendMessage: (text: string) => void;
}

const ChatWorkspace = forwardRef<ChatWorkspaceHandle, ChatWorkspaceProps>(
  function ChatWorkspace({ userId, caseId }, ref) {
    const queryClient = useQueryClient();
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    // Fetch messages with React Query
    const {
      data: messages = [],
      isLoading,
      error,
      refetch,
    } = useQuery<ChatMessage[]>({
      queryKey: ["chatMessages", caseId],
      queryFn: () => fetchChatMessages(caseId),
      staleTime: 0, // Always re-fetch when queryKey changes
    });

    // Auto-scroll to bottom when messages change
    useEffect(() => {
      if (endOfMessagesRef.current) {
        endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [messages]);

    // Format timestamp for display
    const formatTimestamp = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Handle sending a message
    const processMessage = async (text: string) => {
      if (!text.trim()) return;

      try {
        await sendChatMessage(caseId, "user", text);
        await refetch();

        const typingPlaceholder = await sendChatMessage(
          caseId,
          "assistant",
          "..."
        );
        await refetch();

        const documentSummaries = await fetchDocumentSummaries(caseId);

        const summaryMessages = documentSummaries.map((summary) => ({
          role: "assistant",
          content: `Document Summary:\n${summary}`,
        }));

        const currentMessages = await fetchChatMessages(caseId);

        const chatMessages = currentMessages
          .filter((msg) => msg.content !== "...")
          .map((msg) => ({
            role: msg.sender,
            content: msg.content,
          }));

        const fullHistory = [...summaryMessages, ...chatMessages];

        // 🚨 3. CHECK CONTEXT SIZE BEFORE CALLING AI
        const totalTokens = fullHistory.reduce(
          (acc, msg) => acc + estimateTokens(msg.content),
          0
        );

        if (totalTokens > 15000) {
          // If too large, update placeholder with warning
          await supabase
            .from("chat_messages")
            .update({
              content:
                "⚠️ This conversation is too long. Please clear the chat history to continue discussing.",
            })
            .eq("id", typingPlaceholder.id);

          await refetch();
          return;
        }

        const aiReply = await getAIResponse(fullHistory);

        const { error } = await supabase
          .from("chat_messages")
          .update({ content: aiReply })
          .eq("id", typingPlaceholder.id);

        if (error) throw error;

        await refetch();
      } catch (err) {
        console.error("Error in message process:", err);

        try {
          await sendChatMessage(
            caseId,
            "assistant",
            "Sorry, I encountered an error. Please try again."
          );
          await refetch();
        } catch (nestedErr) {
          console.error("Error saving fallback message:", nestedErr);
        }
      }
    };

    // Handle clearing chat messages
    const handleClearChat = async () => {
      setShowDeleteModal(true);
    };

    // Handle confirming chat deletion
    const handleConfirmDelete = async () => {
      if (isModalLoading) return;

      setIsModalLoading(true);
      setModalError(null);

      try {
        await clearChatMessages(caseId);
        await refetch();
        setShowDeleteModal(false);
      } catch (err) {
        console.error("Error clearing chat messages:", err);
        setModalError(
          err instanceof Error
            ? err.message
            : "An error occurred while clearing chat"
        );
      } finally {
        setIsModalLoading(false);
      }
    };

    // Expose the sendMessage method to the parent component
    useImperativeHandle(ref, () => ({
      sendMessage: (text: string) => {
        processMessage(text);
      },
    }));

    // Loading state
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-red-500">
            <h3 className="text-lg font-medium mb-2">Error loading messages</h3>
            <p>{(error as Error).message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header with Clear Chat button */}
        <div className="flex justify-end px-4 py-2 border-b border-gray-200">
          <button
            onClick={handleClearChat}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200"
          >
            Clear Chat
          </button>
        </div>

        <div className="flex-1 px-4 py-2">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-500">
                <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
                <p>Ask any questions about your case documents.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  role={message.sender}
                  content={message.content}
                  timestamp={formatTimestamp(message.created_at)}
                />
              ))}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Clear Chat History
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete your chat history? This action
                  can not be undone and removes your chat logs from our secure
                  servers.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                    disabled={isModalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                    disabled={isModalLoading}
                  >
                    {isModalLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
                {modalError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {modalError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ChatWorkspace.displayName = "ChatWorkspace";

export default ChatWorkspace;

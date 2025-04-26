"use client";
// app/components/ChatWorkspace.tsx

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
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
        // 1. Save user message to Supabase
        await sendChatMessage(caseId, "user", text);
        await refetch();

        // 2. Save temporary "..." assistant typing indicator
        const typingPlaceholder = await sendChatMessage(
          caseId,
          "assistant",
          "..."
        );
        await refetch();

        // 3. Get all current messages (after placeholder)
        const currentMessages = await fetchChatMessages(caseId);

        const aiMessages = currentMessages
          .filter((msg) => msg.content !== "...")
          .map((msg) => ({
            role: msg.sender,
            content: msg.content,
          }));

        // 4. Actually call Claude
        const aiReply = await getAIResponse(aiMessages);

        // 5. Update the "..." message to real AI reply
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
      <div className="flex flex-col h-full px-4 py-2">
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
    );
  }
);

ChatWorkspace.displayName = "ChatWorkspace";

export default ChatWorkspace;

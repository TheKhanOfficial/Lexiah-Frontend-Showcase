"use client";
// app/components/ChatWorkspace.tsx

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ChatBubble } from "@/app/components/ChatBubble";
import { getAIResponse } from "@/utils/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isTyping?: boolean;
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
      if (endOfMessagesRef.current) {
        endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [messages]);

    const formatTimestamp = useCallback(() => {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }, []);

    const processMessage = async (text: string) => {
      // Create user message
      console.log("processMessage called with:", text);

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: formatTimestamp(),
      };

      // Add user message to state using functional update
      setMessages((prevMessages) => {
        // This gives us the most up-to-date messages array
        // Store it locally for API call
        const currentMessages = [...prevMessages, userMessage];

        // Now add typing indicator
        const withTypingIndicator = [
          ...currentMessages,
          {
            id: `typing-${Date.now()}`,
            role: "assistant",
            content: "...",
            isTyping: true,
          },
        ];

        // Update state with typing indicator (for UI only)
        setTimeout(() => {
          // Build API request with just the real messages
          const chatMessages = currentMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

          // Call API with accurate message history
          setIsLoading(true);
          console.log("Calling getAIResponse with:", chatMessages);

          getAIResponse(chatMessages)
            .then((aiReply) => {
              // Success - replace typing indicator with real response
              setMessages((latestMessages) => {
                // Remove any typing indicators
                const withoutTyping = latestMessages.filter(
                  (msg) => !msg.isTyping
                );

                // Add the AI reply
                return [
                  ...withoutTyping,
                  {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: aiReply,
                    timestamp: formatTimestamp(),
                  },
                ];
              });
            })
            .catch((err) => {
              console.error("Error fetching AI response:", err);

              // Error case - replace typing indicator with error message
              setMessages((latestMessages) => {
                // Remove any typing indicators
                const withoutTyping = latestMessages.filter(
                  (msg) => !msg.isTyping
                );

                // Add error message
                return [
                  ...withoutTyping,
                  {
                    id: `error-${Date.now()}`,
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again.",
                    timestamp: formatTimestamp(),
                  },
                ];
              });
            })
            .finally(() => {
              setIsLoading(false);
            });
        }, 0);

        // Return state with typing indicator for immediate UI update
        return withTypingIndicator;
      });
    };

    // Expose the sendMessage method to the parent component
    useImperativeHandle(ref, () => ({
      sendMessage: (text: string) => {
        console.log("Sending message:", text);
        processMessage(text);
      },
    }));

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
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
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

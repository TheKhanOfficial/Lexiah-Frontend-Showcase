"use client";
// app/[userid]/[caseid]/chat/page.tsx

import { useState, useCallback, useRef, useEffect } from "react";
import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";
import { InputBar } from "@/app/components/InputBar";
import { ChatBubble } from "@/app/components/ChatBubble";
import { getAIResponse } from "@/utils/api";
import { useRouter, useParams } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: "documents", label: "Documents", path: "documents" },
    { id: "notes", label: "Notes", path: "notes" },
    { id: "chat", label: "Chat", path: "chat" },
  ];

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

  const handleInputSubmit = async (text: string, isDocumentSearch: boolean) => {
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: formatTimestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Show typing indicator (optional)
      const typingIndicatorId = `typing-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: typingIndicatorId,
          role: "assistant",
          content: "...",
        },
      ]);

      // Get response from API
      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const aiReply = await getAIResponse(chatMessages);

      // Remove typing indicator and add actual response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingIndicatorId);
        return [
          ...filtered,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: aiReply,
            timestamp: formatTimestamp(),
          },
        ];
      });
    } catch (err) {
      console.error("Error fetching AI response:", err);

      // Add error message
      setMessages((prev) => {
        // Remove typing indicator if it exists
        const filtered = prev.filter((m) => !m.id.startsWith("typing-"));
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "Sorry, I encountered an error processing your request. Please try again.",
            timestamp: formatTimestamp(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");

    if (message) {
      // Prevent it from running more than once
      const alreadyHandled = sessionStorage.getItem("chat_message_handled");
      if (!alreadyHandled) {
        sessionStorage.setItem("chat_message_handled", "true");
        handleInputSubmit(message, false);
      }
    }

    return () => {
      // Reset so future redirects can work again
      sessionStorage.removeItem("chat_message_handled");
    };
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        {/* Chat messages - directly in the page instead of a separate component */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-500">
                <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
                <p>Ask any questions about your case documents.</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ))}
              <div ref={endOfMessagesRef} />
            </>
          )}
        </div>

        <InputBar
          onSubmit={handleInputSubmit}
          placeholder="Type your message..."
        />
      </div>
    </MainLayout>
  );
}

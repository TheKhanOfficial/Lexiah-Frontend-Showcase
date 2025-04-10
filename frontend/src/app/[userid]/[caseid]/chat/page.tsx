// app/[userid]/[caseid]/chat/page.tsx
"use client";

import { useState, useCallback } from "react";
import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";
import { InputBar } from "@/app/components/InputBar";
import { ChatLog, type Message } from "@/app/components/chat/ChatLog";
import { getAIResponse } from "@/utils/api";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful legal AI assistant." },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: "documents", label: "Documents", path: "documents" },
    { id: "notes", label: "Notes", path: "notes" },
    { id: "chat", label: "Chat", path: "chat" },
  ];

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
      const aiReply = await getAIResponse(text);

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

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        <ChatLog messages={messages} />

        <InputBar
          onSubmit={handleInputSubmit}
          placeholder="Type your message..."
        />
      </div>
    </MainLayout>
  );
}

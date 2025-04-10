// components/chat/ChatLog.tsx
import { useRef, useEffect } from "react";
import { ChatBubble } from "./ChatBubble";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ChatLogProps {
  messages: Message[];
}

export function ChatLog({ messages }: ChatLogProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
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
  );
}

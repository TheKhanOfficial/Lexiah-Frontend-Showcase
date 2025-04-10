// components/chat/ChatBubble.tsx
import { ReactNode } from "react";
import { User, Bot } from "lucide-react";

type Role = "user" | "assistant";

interface ChatBubbleProps {
  role: Role;
  content: string;
  timestamp?: string;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`flex max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`
          flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
          ${isUser ? "bg-indigo-100 ml-2" : "bg-gray-100 mr-2"}
        `}
        >
          {isUser ? (
            <User className="h-5 w-5 text-indigo-600" />
          ) : (
            <Bot className="h-5 w-5 text-gray-600" />
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`
          rounded-lg px-4 py-2 shadow-sm
          ${
            isUser
              ? "bg-indigo-600 text-white"
              : "bg-white border border-gray-200 text-gray-800"
          }
        `}
        >
          {/* Message content with proper whitespace handling */}
          <div className="whitespace-pre-wrap">
            {content.split("\n").map((paragraph, idx) => (
              <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Timestamp if provided */}
          {timestamp && (
            <div
              className={`text-xs mt-1 ${
                isUser ? "text-indigo-200" : "text-gray-400"
              }`}
            >
              {timestamp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

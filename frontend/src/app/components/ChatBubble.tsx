import { User, Bot } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";

interface ChatBubbleProps {
  role: Role;
  content: string;
  timestamp?: string;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role === "user";

  // 🧠 Handle loading case as full-width branding
  if (content === "...") {
    return (
      <div className="w-full flex justify-center py-10">
        <div className="flex flex-col items-center space-y-2  text-[#111827]">
          <Image
            src="/lexiah.svg"
            alt="Lexiah is thinking"
            width={400}
            height={160}
            className="animate-pulse"
          />
        </div>
      </div>
    );
  }

  // 🧠 Normal bubble render
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
            ${isUser ? "bg-[#111827] ml-2" : "bg-[#111827] mr-2"}
          `}
        >
          {isUser ? (
            <User className="h-5 w-5 text-[#f9fafb]" />
          ) : (
            <Bot className="h-5 w-5 text-[#f9fafb]" />
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`
            rounded-lg px-4 py-2 shadow-sm
            ${
              isUser
                ? "border border-gray-200 bg-[#f9fafb] text-[#111827]"
                : "border border-gray-200 bg-[#f9fafb] text-[#111827]"
            }
          `}
        >
          <div className="prose prose-sm max-w-none text-[#111827]">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>

          {timestamp && (
            <div className="text-xs mt-1 text-[#111827]">{timestamp}</div>
          )}
        </div>
      </div>
    </div>
  );
}

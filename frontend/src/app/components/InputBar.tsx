"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Search, Send } from "lucide-react";

interface InputBarProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export function InputBar({
  onSubmit,
  placeholder = "Type a message or search query...",
}: InputBarProps) {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (inputText.trim()) {
      onSubmit(inputText.trim());
      setInputText("");
    }
  };

  return (
    <div className="border-t border-gray-200 bg-[#F9FAFB] px-4 py-3">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={"Type a message..."}
            className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:hover:text-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

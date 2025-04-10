"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Search, Send } from "lucide-react";

interface InputBarProps {
  onSubmit: (text: string, isDocumentSearch: boolean) => void;
  placeholder?: string;
}

export function InputBar({
  onSubmit,
  placeholder = "Type a message or search query...",
}: InputBarProps) {
  const [inputText, setInputText] = useState("");
  const [isDocumentSearch, setIsDocumentSearch] = useState(false);
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
      onSubmit(inputText.trim(), isDocumentSearch);
      setInputText("");
    }
  };

  const toggleMode = () => {
    setIsDocumentSearch((prev) => !prev);
    // Re-focus the input after toggling
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="mr-3">
          <div className="flex rounded-md border border-gray-300 p-1">
            <button
              type="button"
              onClick={toggleMode}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                !isDocumentSearch
                  ? "bg-gray-800 text-white"
                  : "bg-transparent text-gray-500 hover:bg-gray-100"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={toggleMode}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                isDocumentSearch
                  ? "bg-gray-800 text-white"
                  : "bg-transparent text-gray-500 hover:bg-gray-100"
              }`}
            >
              Document Search
            </button>
          </div>
        </div>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isDocumentSearch ? "Search in documents..." : "Type a message..."
            }
            className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:hover:text-gray-300 disabled:cursor-not-allowed"
          >
            {isDocumentSearch ? (
              <Search className="h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

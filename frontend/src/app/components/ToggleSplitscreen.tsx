"use client";
// components/ToggleSplitscreen.tsx

import { useState } from "react";

interface ToggleSplitscreenProps {
  value: number;
  onChange: (value: number) => void;
}

export function ToggleSplitscreen({ value, onChange }: ToggleSplitscreenProps) {
  // Helper to determine if a value is active
  const isActive = (num: number) => value === num;

  return (
    <div className="flex items-center border-none outline-none rounded">
      <button
        onClick={() => onChange(1)}
        className={`rounded-md p-1 flex items-center justify-center w-8 h-8 ${
          isActive(1)
            ? "bg-[#111827] text-[#F9FAFB]"
            : "text-[#111827] hover:bg-[#111827] hover:text-[#F9FAFB]"
        }`}
        title="Single screen"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      </button>

      <div className="border-none h-6"></div>

      <button
        onClick={() => onChange(2)}
        className={`rounded-md p-1 flex items-center justify-center w-8 h-8 ${
          isActive(2)
            ? "bg-[#111827] text-[#F9FAFB]"
            : "text-[#111827] hover:bg-[#111827] hover:text-[#F9FAFB]"
        }`}
        title="Split screen (2)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      </button>

      <div className="border-none h-6"></div>

      <button
        onClick={() => onChange(3)}
        className={`rounded-md p-1 flex items-center justify-center w-8 h-8 ${
          isActive(3)
            ? "bg-[#111827] text-[#F9FAFB]"
            : "text-[#111827] hover:bg-[#111827] hover:text-[#F9FAFB]"
        }`}
        title="Split screen (3)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="8" y1="3" x2="8" y2="21" />
          <line x1="16" y1="3" x2="16" y2="21" />
        </svg>
      </button>
    </div>
  );
}

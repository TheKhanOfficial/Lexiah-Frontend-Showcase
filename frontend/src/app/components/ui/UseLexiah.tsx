//frontend/src/app/component/ui/UseLexiah.tsx
"use client";

import { useAnonId } from "@/lib/useAnonId";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  text?: string;
  widthClass?: string;
};

export default function UseLexiah({
  text = "Use Lexiah",
  widthClass = "w-fit",
}: Props) {
  const anonId = useAnonId();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (anonId) setReady(true);
  }, [anonId]);

  const handleClick = () => {
    if (anonId) router.push(`/${anonId}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!ready}
      className={`relative group inline-flex items-center justify-center ${widthClass} px-8 py-4 text-lg font-semibold text-white bg-gray-900 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
    >
      <span className="relative z-10 flex items-center">
        {text}
        <svg
          className="ml-3 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}

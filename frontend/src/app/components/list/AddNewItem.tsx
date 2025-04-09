import { useState } from "react";

interface AddNewItemProps {
  onClick: (name: string) => void;
  text?: string;
}

export function AddNewItem({ onClick, text = "Add New" }: AddNewItemProps) {
  const handleClick = () => {
    // Simple browser prompt
    const name = prompt("Enter a name:");

    if (name && name.trim() !== "") {
      onClick(name.trim());
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full py-3 px-4 flex items-center text-indigo-600 hover:bg-indigo-50 transition-colors duration-150"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{text}</span>
    </button>
  );
}

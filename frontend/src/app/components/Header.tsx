// components/Header.tsx
import { useState } from "react";
import { ToggleFullscreen } from "./ToggleFullscreen";
import { ToggleHideShow } from "./ToggleHideShow";

interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // This renders just the toggle button when header is hidden
  if (!isVisible) {
    return (
      <div className="h-10 w-full bg-white shadow-sm flex justify-end items-center px-4">
        <ToggleHideShow isVisible={isVisible} onToggle={toggleVisibility} />
      </div>
    );
  }

  // Full header when visible
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="h-16 px-4 flex justify-between items-center">
        {/* Logo on the left */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-indigo-600">Lexia AI</h1>
        </div>

        {/* Case name in the middle (children prop) */}
        <div className="flex-1 flex justify-center">{children}</div>

        {/* Buttons on the right */}
        <div className="flex items-center space-x-2">
          <ToggleFullscreen />
          <ToggleHideShow isVisible={isVisible} onToggle={toggleVisibility} />
        </div>
      </div>
    </header>
  );
}

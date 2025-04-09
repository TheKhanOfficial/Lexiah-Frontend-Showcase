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

  // No header at all when hidden, just the toggle button with top at window edge
  if (!isVisible) {
    return (
      <div className="absolute top-0 right-4 z-20">
        <ToggleHideShow
          isVisible={isVisible}
          onToggle={toggleVisibility}
          visibleDirection="up"
          hiddenDirection="down"
        />
      </div>
    );
  }

  // Full header when visible
  return (
    <header className="w-full bg-white shadow-sm relative z-10">
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
        </div>
      </div>

      {/* Toggle button positioned exactly at the bottom edge of the header */}
      <div className="absolute -bottom-5 right-4">
        <ToggleHideShow
          isVisible={isVisible}
          onToggle={toggleVisibility}
          visibleDirection="up"
          hiddenDirection="down"
        />
      </div>
    </header>
  );
}

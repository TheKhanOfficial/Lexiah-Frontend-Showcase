"use client";
// components/Header.tsx
import { ToggleFullscreen } from "./ToggleFullscreen";
import { ToggleHideShow } from "./ToggleHideShow";
import { ToggleSplitscreen } from "./ToggleSplitscreen";

interface HeaderProps {
  children?: React.ReactNode;
  isVisible: boolean;
  onToggle: () => void;
  splitscreenCount: number;
  onSplitscreenChange: (value: number) => void;
}

export function Header({
  children,
  isVisible,
  onToggle,
  splitscreenCount,
  onSplitscreenChange,
}: HeaderProps) {
  // Full header when visible
  return (
    <header className="w-full bg-[#F9FAFB] shadow-sm relative z-10">
      <div className="h-16 px-4 flex justify-between items-center">
        {/* Logo on the left */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-indigo-600">Lexia AI</h1>
        </div>

        {/* Case name in the middle (children prop) */}
        <div className="flex-1 flex justify-center">{children}</div>

        {/* Buttons on the right */}
        <div className="flex items-center space-x-2">
          <ToggleSplitscreen
            value={splitscreenCount}
            onChange={onSplitscreenChange}
          />
          <ToggleFullscreen />
        </div>
      </div>

      {/* Toggle button positioned exactly at the bottom edge of the header */}
      <div className="absolute -bottom-5 right-4">
        <ToggleHideShow
          isVisible={isVisible}
          onToggle={onToggle}
          visibleDirection="up"
          hiddenDirection="down"
        />
      </div>
    </header>
  );
}

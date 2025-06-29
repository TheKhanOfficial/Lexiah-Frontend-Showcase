"use client";
// components/Header.tsx
import { ToggleFullscreen } from "./ToggleFullscreen";
import { ToggleHideShow } from "./ToggleHideShow";
import { ToggleSplitscreen } from "./ToggleSplitscreen";
import Image from "next/image";

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
    <header className="border-b border-gray-200 w-full bg-[#F9FAFB] shadow-sm relative z-10">
      <div className="border-gray-200 h-16 px-4 flex justify-between items-center">
        {/* Logo on the left */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-red-600">
            <Image src="/lexiah.svg" alt="Lexiah AI" width={200} height={60} />
          </h1>
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
      <div className="absolute -bottom-8 right-4">
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

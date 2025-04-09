// components/ToggleHideShow.tsx
import React from "react";

// Defining the possible directions for the button
export type Direction = "up" | "down" | "left" | "right";

interface ToggleHideShowProps {
  isVisible: boolean;
  onToggle: () => void;
  // Direction when visible (button will point this way when content is showing)
  visibleDirection?: Direction;
  // Direction when hidden (button will point this way when content is hidden)
  hiddenDirection?: Direction;
  // Position the button on the edge of the container
  position?: "top" | "bottom" | "left" | "right";
}

export function ToggleHideShow({
  isVisible,
  onToggle,
  visibleDirection = "up",
  hiddenDirection = "down",
  position = "right",
}: ToggleHideShowProps) {
  // Current direction based on visibility state
  const direction = isVisible ? visibleDirection : hiddenDirection;

  // Determine which SVG to show based on the current direction
  const getDirectionSvg = () => {
    switch (direction) {
      case "up":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "down":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "left":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "right":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onToggle}
      className="p-1.5 bg-white border border-gray-200 hover:bg-gray-100 shadow-sm z-10 flex items-center justify-center"
      aria-label={isVisible ? "Hide content" : "Show content"}
    >
      {getDirectionSvg()}
    </button>
  );
}

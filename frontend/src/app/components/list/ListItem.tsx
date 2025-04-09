// components/list/ListItem.tsx
import { ReactNode } from "react";

interface ListItemProps {
  onClick?: () => void;
  title: string;
  subtitle?: string;
  isSelected?: boolean;
  rightContent?: ReactNode;
}

export function ListItem({
  onClick,
  title,
  subtitle,
  isSelected = false,
  rightContent,
}: ListItemProps) {
  return (
    <li
      className={`cursor-pointer transition-colors duration-150 ${
        isSelected ? "bg-gray-200" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="px-4 py-3 flex items-center">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        {rightContent && (
          <div className="ml-2 flex-shrink-0">{rightContent}</div>
        )}
      </div>
    </li>
  );
}

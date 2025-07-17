// components/list/ListItem.tsx
import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { ItemType } from "./AddNewItem";

interface ListItemProps {
  id: string;
  userId: string;
  itemType: ItemType;
  onClick?: () => void;
  title: string;
  subtitle?: string;
  isSelected?: boolean;
  rightContent?: ReactNode;
  onRename?: (id: string) => void; // Changed to just trigger rename request
  onDelete?: (id: string) => void; // Changed to just trigger delete request
  customEmoji?: string;
}

export function ListItem({
  id,
  userId,
  itemType,
  onClick,
  title,
  subtitle,
  isSelected = false,
  rightContent,
  onRename,
  onDelete,
  customEmoji,
}: ListItemProps) {
  // Stop propagation to prevent triggering the list item click
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle delete click in dropdown
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  // Handle rename click in dropdown
  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRename) {
      onRename(id);
    }
  };

  const getItemEmoji = (type: ItemType): string => {
    switch (type) {
      case "case":
        return "💼";
      case "document":
        return "📖";
      case "note":
        return "📝";
      default:
        return "";
    }
  };

  return (
    <li
      className={`list-none p-0 m-0 rounded-md cursor-pointer transition-colors duration-150 ${
        isSelected ? "on-click" : "hover:bg-[#111827] hover:text-[#f9fafb]"
      }`}
      onClick={onClick}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-start gap-2">
          {/* Emoji block (matches folder emoji style exactly) */}
          <div className="flex-shrink-0 flex items-center justify-center h-full pt-0.5">
            <span className="text-3xl leading-[1]">
              {customEmoji || getItemEmoji(itemType)}
            </span>
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium truncate">{title}</p>
            {subtitle && <p className="text-xs truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center">
          {rightContent && (
            <div className="m-2 flex-shrink-0">{rightContent}</div>
          )}

          <div onClick={handleDropdownClick}>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
                <span className="text-gray-500">...</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRenameClick}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteClick}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </li>
  );
}

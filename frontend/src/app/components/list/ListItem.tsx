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

  return (
    <li
      className={`cursor-pointer transition-colors duration-150 ${
        isSelected ? "bg-gray-200" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center">
          {rightContent && (
            <div className="mr-2 flex-shrink-0">{rightContent}</div>
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

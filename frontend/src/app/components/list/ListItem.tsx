// components/list/ListItem.tsx
import { useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

interface ListItemProps {
  onClick?: () => void;
  title: string;
  subtitle?: string;
  isSelected?: boolean;
  rightContent?: ReactNode;
  onRename?: () => void;
  onDelete?: () => void;
}

export function ListItem({
  onClick,
  title,
  subtitle,
  isSelected = false,
  rightContent,
  onRename,
  onDelete,
}: ListItemProps) {
  // State to control the alert dialog
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Stop propagation to prevent triggering the list item click
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle delete click in dropdown
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

  // Handle confirming deletion
  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteAlert(false);
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
                <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteClick}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Custom alert dialog that renders directly to document.body */}
      {showDeleteAlert &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={() => setShowDeleteAlert(false)}
          >
            <div
              className="bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-2">
                Are you absolutely sure?
              </h2>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. This will remove your case and all
                of its documents, notes, and chat permanently from your account
                and our servers.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                  onClick={() => setShowDeleteAlert(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  onClick={handleConfirmDelete}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </li>
  );
}

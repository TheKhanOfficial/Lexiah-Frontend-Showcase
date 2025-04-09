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
  onRename?: (newName: string) => void;
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
  // State to control the alert dialog and rename modal
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState(title);

  // Stop propagation to prevent triggering the list item click
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle delete click in dropdown
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

  // Handle rename click in dropdown
  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(title); // Reset to current title
    setShowRenameModal(true);
  };

  // Handle confirming deletion
  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteAlert(false);
  };

  // Handle confirming rename
  const handleConfirmRename = () => {
    if (onRename && renameValue.trim() !== "") {
      onRename(renameValue.trim());
    }
    setShowRenameModal(false);
  };

  // Handle Enter key press in rename input
  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && renameValue.trim() !== "") {
      handleConfirmRename();
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

      {/* Delete confirmation modal */}
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

      {/* Rename modal */}
      {showRenameModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={() => setShowRenameModal(false)}
          >
            <div
              className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Rename</h2>

              <div className="mb-4">
                <label
                  htmlFor="rename-input"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  id="rename-input"
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter name"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                  onClick={() => setShowRenameModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                  onClick={handleConfirmRename}
                  disabled={!renameValue.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </li>
  );
}

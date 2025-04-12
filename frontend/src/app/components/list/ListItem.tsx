// components/list/ListItem.tsx
import { useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  renameCase,
  renameDocument,
  renameNote,
  deleteCase,
  deleteDocument,
  deleteNote,
} from "@/utils/supabase";
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
  onRenameSuccess?: (id: string, newName: string) => void;
  onDeleteSuccess?: (id: string) => void;
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
  onRenameSuccess,
  onDeleteSuccess,
}: ListItemProps) {
  // State to control the alert dialog and rename modal
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stop propagation to prevent triggering the list item click
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle delete click in dropdown
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteAlert(true);
    setErrorMessage(null);
  };

  // Handle rename click in dropdown
  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(title); // Reset to current title
    setShowRenameModal(true);
    setErrorMessage(null);
  };

  // Handle confirming deletion
  const handleConfirmDelete = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Call the appropriate delete function based on item type
      switch (itemType) {
        case "case":
          await deleteCase(id);
          break;
        case "document":
          await deleteDocument(id);
          break;
        case "note":
          await deleteNote(id);
          break;
        default:
          throw new Error(`Unsupported item type: ${itemType}`);
      }

      if (onDeleteSuccess) {
        onDeleteSuccess(id);
      }

      setShowDeleteAlert(false);
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while deleting"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirming rename
  const handleConfirmRename = async () => {
    if (isLoading || renameValue.trim() === "" || renameValue.trim() === title)
      return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Call the appropriate rename function based on item type
      let updatedItem;
      switch (itemType) {
        case "case":
          updatedItem = await renameCase(id, renameValue.trim());
          break;
        case "document":
          updatedItem = await renameDocument(id, renameValue.trim());
          break;
        case "note":
          updatedItem = await renameNote(id, renameValue.trim());
          break;
        default:
          throw new Error(`Unsupported item type: ${itemType}`);
      }

      if (onRenameSuccess) {
        onRenameSuccess(id, renameValue.trim());
      }

      setShowRenameModal(false);
    } catch (error) {
      console.error(`Error renaming ${itemType}:`, error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while renaming"
      );
    } finally {
      setIsLoading(false);
    }
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
            onClick={() => !isLoading && setShowDeleteAlert(false)}
          >
            <div
              className="bg-white rounded-lg max-w-md mx-auto p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-2">
                Are you absolutely sure?
              </h2>
              <p className="text-gray-600 mb-4">
                This action cannot be undone. This will permanently remove this{" "}
                {itemType}
                {itemType === "case"
                  ? " and all of its documents, notes, and chat"
                  : ""}{" "}
                from your account and our servers.
              </p>

              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setShowDeleteAlert(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 flex items-center"
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
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
            onClick={() => !isLoading && setShowRenameModal(false)}
          >
            <div
              className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Rename {itemType}</h2>

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
                  disabled={isLoading}
                />
              </div>

              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setShowRenameModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
                  onClick={handleConfirmRename}
                  disabled={
                    !renameValue.trim() ||
                    isLoading ||
                    renameValue.trim() === title
                  }
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </li>
  );
}

// components/modals/RenameDeleteModal.tsx
"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

interface RenameDeleteModalProps {
  showModal: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  modalError: string | null;
  type: "rename" | "delete";
  itemName?: string;
  itemType: "case" | "document" | "note";
  inputValue?: string;
  setInputValue?: (value: string) => void;
}

export function RenameDeleteModal({
  showModal,
  onClose,
  onConfirm,
  isLoading,
  modalError,
  type,
  itemName,
  itemType,
  inputValue = "",
  setInputValue,
}: RenameDeleteModalProps) {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalElement(document.body);
  }, []);

  // Handle Enter key press in rename input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type === "rename" && inputValue.trim() !== "") {
      onConfirm();
    }
  };

  if (!portalElement || !showModal) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {type === "rename" ? (
          <>
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
                value={inputValue}
                onChange={(e) => setInputValue?.(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter name"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2">
              Are you absolutely sure?
            </h2>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently remove this{" "}
              {itemType}
              {itemType === "case" &&
                " and all of its documents, notes, and chat"}{" "}
              from your account and our servers.
            </p>
          </>
        )}

        {modalError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
            <p className="text-sm text-red-600">{modalError}</p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 ${
              type === "delete"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white rounded-full disabled:bg-opacity-50 flex items-center`}
            onClick={onConfirm}
            disabled={
              isLoading ||
              (type === "rename" &&
                (!inputValue.trim() || inputValue.trim() === itemName))
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
                {type === "delete" ? "Deleting..." : "Saving..."}
              </>
            ) : type === "delete" ? (
              "Delete"
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>,
    portalElement
  );
}

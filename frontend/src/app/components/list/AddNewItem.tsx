// components/list/AddNewItem.tsx
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCase, addDocument, addNote } from "@/utils/supabase";

export type ItemType = "case" | "document" | "note";

interface AddNewItemProps {
  userId: string;
  caseId?: string; // Optional - only needed for documents and notes
  itemType: ItemType;
  onSuccess?: (newItem: any) => void; // Callback after successful addition
  onError?: (error: Error) => void; // Callback for error handling
  text?: string;
  fileUploadEnabled?: boolean;
  fileTypes?: string; // e.g. ".pdf,.doc,.docx,application/msword"
}

export function AddNewItem({
  userId,
  caseId,
  itemType,
  onSuccess,
  onError,
  text = "Add New",
  fileUploadEnabled = false,
  fileTypes = ".pdf",
}: AddNewItemProps) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  // Helper function to ensure we always have a proper Error object
  const ensureError = (error: unknown): Error => {
    if (error instanceof Error) return error;

    let message = "Unknown error occurred";
    if (typeof error === "string") {
      message = error;
    } else if (error && typeof error === "object") {
      try {
        message = JSON.stringify(error) || "Unknown error object";
      } catch {
        message = "Error object cannot be stringified";
      }
    }

    return new Error(message);
  };

  // Create mutations for different item types
  const caseMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => addCase(userId, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases", userId] });
      if (onSuccess) onSuccess(data);
      handleCloseModal();
    },
    onError: (error) => {
      const err = ensureError(error);
      setErrorMessage(err.message);
      if (onError) onError(err);
    },
  });

  const documentMutation = useMutation({
    mutationFn: ({ name, file }: { name: string; file?: File }) => {
      if (!caseId) throw new Error("Case ID is required for adding documents");
      return addDocument(userId, caseId, name, file);
    },
    onSuccess: (data) => {
      if (caseId) {
        queryClient.invalidateQueries({
          queryKey: ["documents", userId, caseId],
        });
      }
      if (onSuccess) onSuccess(data);
      handleCloseModal();
    },
    onError: (error) => {
      const err = ensureError(error);
      setErrorMessage(err.message);
      if (onError) onError(err);
    },
  });

  const noteMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => {
      if (!caseId) throw new Error("Case ID is required for adding notes");
      return addNote(userId, caseId, name);
    },
    onSuccess: (data) => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: ["notes", userId, caseId] });
      }
      if (onSuccess) onSuccess(data);
      handleCloseModal();
    },
    onError: (error) => {
      const err = ensureError(error);
      setErrorMessage(err.message);
      if (onError) onError(err);
    },
  });

  const isLoading =
    caseMutation.isPending ||
    documentMutation.isPending ||
    noteMutation.isPending;

  const handleOpenModal = () => {
    setShowModal(true);
    setInputValue("");
    setSelectedFile(null);
    setErrorMessage(null);
  };

  const handleCloseModal = () => {
    if (isLoading) return; // Prevent closing while loading
    setShowModal(false);
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || isLoading) return;
    setErrorMessage(null);

    try {
      // Execute the appropriate mutation based on item type
      switch (itemType) {
        case "case":
          caseMutation.mutate({ name: inputValue.trim() });
          break;
        case "document":
          documentMutation.mutate({
            name: inputValue.trim(),
            file: selectedFile || undefined,
          });
          break;
        case "note":
          noteMutation.mutate({
            name: inputValue.trim(),
          });
          break;
        default:
          throw new Error(`Unsupported item type: ${itemType}`);
      }
    } catch (e) {
      // This catch will only handle synchronous errors, but mutation errors are handled in onError
      const error = ensureError(e);
      setErrorMessage(error.message);
      if (onError) onError(error);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setSelectedFile(file);
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="rounded-md w-full py-3 px-4 flex items-center text-red-600 hover:bg-[#111827] transition-colors duration-150"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>{text}</span>
      </button>

      {/* Modal Portal */}
      {showModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">{text}</h2>

              {errorMessage && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                  <p className="font-medium">Error</p>
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="name-input"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  id="name-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter name"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {/* File upload section - only shown when enabled AND not for notes */}
              {fileUploadEnabled && itemType !== "note" && (
                <div className="mb-4">
                  <label
                    htmlFor="file-input"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    File {itemType === "document" ? "" : "(optional)"}
                  </label>

                  {!selectedFile ? (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label
                            htmlFor="file-input"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-input"
                              ref={fileInputRef}
                              name="file-input"
                              type="file"
                              className="sr-only"
                              accept={fileTypes}
                              onChange={handleFileChange}
                              disabled={isLoading}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF-up to {`${MAX_FILE_SIZE_MB}`}MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between p-4 border border-gray-300 rounded-md">
                      <div className="flex items-center">
                        <svg
                          className="h-6 w-6 text-red-600 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-sm truncate max-w-xs">
                          {selectedFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="ml-2 text-sm text-red-500 hover:text-red-700"
                        onClick={clearSelectedFile}
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center"
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isLoading}
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
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

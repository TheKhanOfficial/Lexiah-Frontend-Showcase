// components/list/AddNewItem.tsx
import { useState, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/utils/supabase";

interface AddNewItemProps {
  onClick: (name: string, file?: File) => void;
  text?: string;
  fileUploadEnabled?: boolean;
  fileTypes?: string; // e.g. ".pdf,.doc,.docx,application/msword"
}

export function AddNewItem({
  onClick,
  text = "Add New",
  fileUploadEnabled = false,
  fileTypes = ".pdf,.doc,.docx,.txt",
}: AddNewItemProps) {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userID = `53917586-97ad-49b6-9bd6-51c441316425`;

  const handleOpenModal = () => {
    setShowModal(true);
    setInputValue("");
    setSelectedFile(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      // Pass both name and file (if present) to the callback
      onClick(inputValue.trim(), selectedFile || undefined);
      handleCloseModal();
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
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
        className="w-full py-3 px-4 flex items-center text-indigo-600 hover:bg-indigo-50 transition-colors duration-150"
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
                />
              </div>

              {/* File upload section - only shown when enabled */}
              {fileUploadEnabled && (
                <div className="mb-4">
                  <label
                    htmlFor="file-input"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    File (optional)
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
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
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
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, TXT up to 10MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between p-4 border border-gray-300 rounded-md">
                      <div className="flex items-center">
                        <svg
                          className="h-6 w-6 text-indigo-500 mr-2"
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
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

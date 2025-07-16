//components/list/AddNewFolder.tsx
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTopLevelFolder, addSubFolder } from "@/utils/supabase";

interface Folder {
  id: string;
  name: string;
  user_id: string;
  case_id: string;
  parent_id: string | null;
}

interface AddNewFolderProps {
  userId: string;
  caseId: string;
  parentId?: string | null;
  text?: string;
  onSuccess?: (newFolder: Folder) => void;
}

// Supabase function to add a new folder
async function addFolder(
  userId: string,
  caseId: string,
  name: string,
  parentId: string | null = null
) {
  const listType = "cases";

  if (parentId) {
    return await addSubFolder(userId, listType, name, parentId);
  } else {
    return await addTopLevelFolder(userId, listType, name);
  }
}

export function AddNewFolder({
  userId,
  caseId,
  parentId = null,
  text = "New Folder 📁",
  onSuccess,
}: AddNewFolderProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenModal = () => {
    setIsEditing(true);
    setInputValue("");
    setErrorMessage(null);
  };

  const mutation = useMutation({
    mutationFn: ({ name }: { name: string }) =>
      addFolder(userId, caseId, name, parentId),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["folders", userId, "cases"] });

      if (onSuccess) onSuccess(data);
      handleReset();
    },
    onError: (error) => {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create folder";
      setErrorMessage(errorMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = inputValue.trim();

    if (!trimmedName) {
      setErrorMessage("Folder name is required");
      return;
    }

    setErrorMessage(null);
    mutation.mutate({ name: trimmedName });
  };

  const handleReset = () => {
    setIsEditing(false);
    setInputValue("");
    setErrorMessage(null);
  };

  if (!isEditing) {
    return (
      <button
        onClick={handleOpenModal}
        className="rounded-md w-full py-3 px-4 flex items-center text-[#2563eb] hover:bg-[#111827] transition-colors duration-150"
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
    );
  }

  return (
    <>
      <button
        onClick={() => setIsEditing(true)}
        className="rounded-md w-full py-3 px-4 flex items-center text-[#2563eb] hover:bg-[#111827] transition-colors duration-150"
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

      {isEditing &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={handleReset}
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
                <input
                  id="folder-name"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter folder name"
                  autoFocus
                  disabled={mutation.isPending}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="rounded-full px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                  onClick={handleReset}
                  disabled={mutation.isPending}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center"
                  onClick={(e) => handleSubmit(e)}
                  disabled={!inputValue.trim() || mutation.isPending}
                >
                  {mutation.isPending ? (
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

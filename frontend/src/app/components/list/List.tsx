// components/list/List.tsx
import { ReactNode, useState, useEffect } from "react";
import { AddNewItem, ItemType } from "./AddNewItem";
import { AddNewFolder } from "./AddNewFolder";
import { useQueryClient } from "@tanstack/react-query";
import FolderTree from "./FolderTree";

interface ListProps<T extends { id: string }> {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  userId: string;
  caseId?: string;
  itemType: ItemType;
  onItemAdded?: (newItem: any) => void; // Callback after successful addition
  addItemText?: string;
  emptyMessage?: string;
  sortBy?: keyof T;
  sortDirection?: "asc" | "desc";
  fileUploadEnabled?: boolean;
  isLoading?: boolean;
  onAddItemRequest?: () => void; // New prop to handle add item request externally
  onAddItemError?: (error: Error) => void; // Callback for error handling
  folders?: Folder[];
}

function buildFolderTree(folders: Folder[]): Folder[] {
  const map = new Map<string, Folder & { children: Folder[] }>();
  const roots: Folder[] = [];

  folders.forEach((folder) => map.set(folder.id, { ...folder, children: [] }));

  folders.forEach((folder) => {
    const node = map.get(folder.id)!;
    if (folder.parent_id) {
      map.get(folder.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function List<T extends { id: string }>({
  title,
  items,
  renderItem,
  userId,
  caseId,
  itemType,
  onItemAdded,
  onAddItemRequest,
  folders,
  onAddItemError,
  addItemText = "Add New",
  emptyMessage = "No items yet",
  sortBy,
  sortDirection = "desc",
  fileUploadEnabled = false,
  isLoading = false,
}: ListProps<T>) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  // Sort items if sortBy is provided
  const sortedItems = sortBy
    ? [...items].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        // Check if values are dates and compare them
        if (typeof aValue === "string" && typeof bValue === "string") {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();

          if (!isNaN(aDate) && !isNaN(bDate)) {
            return sortDirection === "desc" ? bDate - aDate : aDate - bDate;
          }
        }

        // Default string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "desc"
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        }

        // Default comparison for other types
        return sortDirection === "desc"
          ? (bValue as any) - (aValue as any)
          : (aValue as any) - (bValue as any);
      })
    : items;

  const folderTree = buildFolderTree(folders || []);
  const filteredItems = sortedItems.filter((item) =>
    (item as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle successful item addition
  const handleItemAdded = (newItem: any) => {
    setErrorMessage(null);
    if (onItemAdded) {
      onItemAdded(newItem);
    }
  };

  // Handle errors during item addition
  const handleItemError = (error: Error) => {
    console.error("Error adding item:", error);
    setErrorMessage(error.message);

    // Pass error to parent if callback exists
    if (onAddItemError) {
      onAddItemError(error);
    }

    // Clear error after 5 seconds
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchInput.trim() === "") {
      setSearchQuery("");
    }
  }, [searchInput]);

  return (
    <div className="flex flex-col h-full">
      {/* Error message display */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-2">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* AddNewItem at the top */}
      <div className="flex flex-col h-full space-y-1">
        <div className="mt-2">
          <AddNewItem
            userId={userId}
            caseId={caseId}
            itemType={itemType}
            onSuccess={handleItemAdded}
            onError={handleItemError}
            text={addItemText}
            fileUploadEnabled={fileUploadEnabled}
          />
          <AddNewFolder
            userId={userId}
            caseId={caseId ?? null}
            parentId={null}
            text="New Folder 📁"
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["folders", userId, caseId],
              });
            }}
          />

          <div className="mt-2 px-2 relative">
            <input
              type="text"
              placeholder="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchQuery(searchInput);
                }
              }}
              className="w-full pr-20 pl-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 placeholder-gray-400 transition"
            />

            {/* X clear button */}
            {searchInput.trim() !== "" && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
                title="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* Search button */}
            <button
              onClick={() => setSearchQuery(searchInput)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black focus:outline-none"
              title="Search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18.5a7.5 7.5 0 006.15-3.85z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="animate-spin rounded-full h-8 w-8"></div>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <>
              {/* Items not in folders */}
              <ul className="space-y-1 mb-4">
                {filteredItems
                  .filter((item) => !(item as any).folder_id)
                  .map((item, index) => renderItem(item, index))}
              </ul>

              {/* Recursive folder rendering */}
              {folderTree.map((folder) => (
                <FolderTree
                  key={folder.id}
                  folder={folder}
                  items={filteredItems}
                  renderItem={(item) => renderItem(item, 0)} // ignore index here
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

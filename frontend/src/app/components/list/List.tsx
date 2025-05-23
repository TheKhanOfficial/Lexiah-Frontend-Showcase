// components/list/List.tsx
import { ReactNode, useState } from "react";
import { AddNewItem, ItemType } from "./AddNewItem";

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
  onAddItemError,
  addItemText = "Add New",
  emptyMessage = "No items yet",
  sortBy,
  sortDirection = "desc",
  fileUploadEnabled = false,
  isLoading = false,
}: ListProps<T>) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            <ul className="space-y-1">
              {sortedItems.map((item, index) => renderItem(item, index))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

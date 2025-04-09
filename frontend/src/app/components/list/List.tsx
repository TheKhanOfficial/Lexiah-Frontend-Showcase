// components/list/List.tsx
import { useState, ReactNode } from "react";
import { AddNewItem } from "./AddNewItem";

interface ListProps<T extends { id: string }> {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onAddItem?: (name: string, file?: File) => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
  addItemText?: string;
  emptyMessage?: string;
  sortBy?: keyof T;
  sortDirection?: "asc" | "desc";
  fileUploadEnabled?: boolean;
}

export function List<T extends { id: string }>({
  title,
  items,
  renderItem,
  onAddItem,
  onRename,
  onDelete,
  addItemText = "Add New",
  emptyMessage = "No items yet",
  sortBy,
  sortDirection = "desc",
  fileUploadEnabled = false,
}: ListProps<T>) {
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700">{title}</h2>
      </div>

      <>
        {/* AddNewItem at the top */}
        {onAddItem && (
          <div className="border-b border-gray-200">
            <AddNewItem
              onClick={onAddItem}
              text={addItemText}
              fileUploadEnabled={fileUploadEnabled}
            />
          </div>
        )}

        <div className="flex-grow overflow-y-auto">
          {sortedItems.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sortedItems.map((item, index) => renderItem(item, index))}
            </ul>
          )}
        </div>
      </>
    </div>
  );
}

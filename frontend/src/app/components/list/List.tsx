// components/list/List.tsx
import { useState, ReactNode } from "react";
import { AddNewItem } from "./AddNewItem";

interface ListProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onAddItem?: () => void;
  addItemText?: string;
  emptyMessage?: string;
  isCollapsible?: boolean;
}

export function List<T>({
  title,
  items,
  renderItem,
  onAddItem,
  addItemText = "Add New",
  emptyMessage = "No items yet",
  isCollapsible = true,
}: ListProps<T>) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700">{title}</h2>
        {isCollapsible && (
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-grow overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4 text-gray-500">
                {emptyMessage}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {items.map((item, index) => renderItem(item, index))}
              </ul>
            )}
          </div>

          {onAddItem && (
            <div className="border-t border-gray-200">
              <AddNewItem onClick={onAddItem} text={addItemText} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

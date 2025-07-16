//components/list/FolderTree.tsx
import React, { useState } from "react";

interface Folder {
  id: string;
  name: string;
  user_id: string;
  case_id: string;
  parent_id: string | null;
}

interface FolderWithChildren extends Folder {
  children: Folder[];
}

interface ItemWithFolderId {
  id: string;
  folder_id: string | null;
}

interface FolderTreeProps<T extends ItemWithFolderId> {
  folder: FolderWithChildren;
  items: T[];
  renderItem: (item: T) => JSX.Element;
  level?: number;
}

export default function FolderTree<T extends ItemWithFolderId>({
  folder,
  items = [],
  renderItem,
  level = 0,
}: FolderTreeProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter items that belong to this folder
  const folderItems = items.filter((item) => item.folder_id === folder.id);
  const children = folder.children || [];

  return (
    <div>
      {/* Folder header */}
      <div
        className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="mr-2 text-lg">{isExpanded ? "📂" : "📁"}</span>
        <span className="font-medium text-gray-900 select-none">
          {folder.name}
        </span>
      </div>

      {/* Folder contents (when expanded) */}
      {isExpanded && (
        <div>
          {/* Render items in this folder */}
          {folderItems.map((item) => (
            <div
              key={item.id}
              className="py-1"
              style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}
            >
              {renderItem(item)}
            </div>
          ))}

          {/* Recursively render child folders */}
          {children.map((childFolder) => (
            <FolderTree
              key={childFolder.id}
              folder={childFolder}
              items={items}
              renderItem={renderItem}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

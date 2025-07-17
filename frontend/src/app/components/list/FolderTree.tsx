//components/list/FolderTree.tsx
import React, { useState } from "react";
import { AddNewFolder } from "./AddNewFolder";
import { useQueryClient } from "@tanstack/react-query";

interface Folder {
  id: string;
  name: string;
  user_id: string;
  case_id: string;
  parent_id: string | null;
  list_type?: string;
  created_at?: string;
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
  renderItem: (item: T, index: number) => JSX.Element;
  level?: number;
  listType: string; // <- required for reusability
}

export default function FolderTree<T extends ItemWithFolderId>({
  folder,
  items = [],
  renderItem,
  level = 0,
  listType,
}: FolderTreeProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const handleToggle = () => setIsExpanded(!isExpanded);

  const folderItems = items.filter((item) => item.folder_id === folder.id);

  console.log("All items:", items);
  console.log("Current folder ID:", folder.id);
  console.log(
    "Children found:",
    items.filter((f) => f.parent_id === folder.id)
  );

  const children = items
    .filter(
      (f): f is FolderWithChildren =>
        f.parent_id === folder.id && f.list_type === listType
    )
    .map((child) => ({
      ...child,
      children: items.filter((grandchild) => grandchild.parent_id === child.id),
    }));

  return (
    <div className="ml-4">
      {/* Folder header with click-to-expand */}
      <div onClick={handleToggle} className="cursor-pointer select-none">
        {renderItem(
          {
            ...folder,
            folder_id: folder.parent_id,
            created_at: folder.created_at ?? "",
            __isFolder: true,
          } as any,
          0
        )}
      </div>

      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {/* Add Subfolder */}
          <AddNewFolder
            userId={folder.user_id}
            caseId={folder.case_id}
            parentId={folder.id}
            text="Add Subfolder 📂"
            listType={listType}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["folders", folder.user_id, listType],
              });
            }}
          />

          {/* Items inside this folder */}
          {folderItems.map((item, index) => (
            <div key={item.id}>{renderItem(item, index)}</div>
          ))}

          {/* Recursive children */}
          {children.map((childFolder, index) => (
            <FolderTree
              key={childFolder.id}
              folder={childFolder}
              items={items}
              renderItem={renderItem}
              level={level + 1}
              listType={listType}
            />
          ))}
        </div>
      )}
    </div>
  );
}

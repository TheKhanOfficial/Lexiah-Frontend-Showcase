//components/list/FolderTree.tsx
import React, { useState } from "react";
import { AddNewFolder } from "./AddNewFolder";
import { useQueryClient } from "@tanstack/react-query";
import { AddNewItem } from "./AddNewItem";

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
  allFolders: Folder[]; // ✅ NEW
  renderItem: (item: T, index: number) => JSX.Element;
  level?: number;
  listType: string;
}

export default function FolderTree<T extends ItemWithFolderId>({
  folder,
  items = [],
  renderItem,
  level = 0,
  listType,
  allFolders,
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

  const children = folder.children || [];

  return (
    <div>
      {/* Folder header with click-to-expand */}
      <div
        onClick={handleToggle}
        className="flex items-center gap-0 cursor-pointer select-none"
      >
        <div className="flex-shrink-0 flex items-center justify-center h-full pt-0.5">
          <span className="text-3xl leading-[1]">
            {isExpanded ? "📂" : "📁"}
          </span>
        </div>
        <div className="flex-1">
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
      </div>

      {isExpanded && (
        <div className="mt-1 space-y-1 border-b-4 border-[#111827] pb-2">
          <AddNewItem
            userId={folder.user_id}
            folderId={folder.id} // 🔥 pass the folder this case belongs in
            itemType="case"
            text="New Case in Folder 💼"
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["cases", folder.user_id],
              });
            }}
          />
          {/* Add Subfolder */}
          <AddNewFolder
            userId={folder.user_id}
            caseId={folder.case_id}
            parentId={folder.id}
            text="New Subfolder 📂"
            listType={listType}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["folders", folder.user_id, listType],
              });
            }}
          />

          {/* Items inside this folder */}
          <ul className="list-none p-0 m-0 space-y-1">
            {folderItems.map((item, index) => renderItem(item, index))}
          </ul>

          {/* Recursive children */}
          {children.map((childFolder, index) => (
            <FolderTree
              key={childFolder.id}
              folder={childFolder}
              items={items}
              allFolders={allFolders} // ✅ NEW
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

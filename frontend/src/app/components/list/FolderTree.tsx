//components/list/FolderTree.tsx
import React, { useState } from "react";
import { AddNewFolder } from "./AddNewFolder";

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
    <>
      {/* Recursive rendering: subfolder and its items */}
      {children.map((childFolder, index) => (
        <div key={childFolder.id}>
          {renderItem(
            {
              ...childFolder,
              folder_id: folder.id,
              created_at: childFolder.created_at ?? "",
              __isFolder: true,
            } as any,
            index
          )}

          {isExpanded && (
            <FolderTree
              folder={childFolder}
              items={items}
              renderItem={renderItem}
              level={level + 1}
            />
          )}
        </div>
      ))}

      {isExpanded && (
        <div>
          {/* Items inside this folder */}
          {folderItems.map((item, index) => (
            <div key={item.id}>{renderItem(item, index)}</div>
          ))}

          {/* Add new subfolder */}
          <div className="pl-6 pr-2 mt-2">
            <AddNewFolder
              userId={folder.user_id}
              caseId={folder.case_id}
              parentId={folder.id}
              text="Add Subfolder 📂"
              onSuccess={() => {}}
            />
          </div>
        </div>
      )}
    </>
  );
}

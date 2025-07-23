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
  color?: string; // ✅ add this
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
  sortOption: "urgency" | "newest" | "oldest" | "alpha";
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string, isFolder: boolean) => void;
  moveTargetSelectionMode?: boolean;
  fileUploadEnabled?: boolean;
}

const itemTypeFromListType = (
  listType: string
): "case" | "note" | "document" => {
  switch (listType) {
    case "cases":
      return "case";
    case "documents":
      return "document";
    case "notes":
      return "note";
    default:
      throw new Error(`Unsupported listType: ${listType}`);
  }
};

const emojiFromItemType = {
  case: "💼",
  document: "📖",
  note: "📝",
};

export default function FolderTree<T extends ItemWithFolderId>({
  folder,
  items = [],
  renderItem,
  level = 0,
  listType,
  allFolders,
  sortOption,
  selectMode,
  selectedIds,
  onSelect,
  moveTargetSelectionMode,
  fileUploadEnabled,
}: FolderTreeProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const handleToggle = () => setIsExpanded(!isExpanded);

  const folderItemsRaw = items.filter((item) => item.folder_id === folder.id);
  const childrenRaw = folder.children || [];

  let sortedFolderItems: T[] = [];
  let sortedChildren: FolderWithChildren[] = [];
  let mixedSorted: (T | (FolderWithChildren & { __isFolder: true }))[] = [];

  if (sortOption === "urgency") {
    // Mixed sort of items + folders by created_at
    mixedSorted = [
      ...childrenRaw.map((f) => ({ ...f, __isFolder: true })),
      ...folderItemsRaw,
    ].sort((a, b) => {
      const timeA = new Date(a.created_at ?? "").getTime();
      const timeB = new Date(b.created_at ?? "").getTime();
      return timeB - timeA;
    });
  } else {
    const compareFn = (
      a: { created_at?: string; name?: string },
      b: { created_at?: string; name?: string }
    ) => {
      if (sortOption === "newest") {
        return (
          new Date(b.created_at ?? "").getTime() -
          new Date(a.created_at ?? "").getTime()
        );
      } else if (sortOption === "oldest") {
        return (
          new Date(a.created_at ?? "").getTime() -
          new Date(b.created_at ?? "").getTime()
        );
      } else if (sortOption === "alpha") {
        return (a.name ?? "").localeCompare(b.name ?? "");
      }
      return 0;
    };

    sortedFolderItems = [...folderItemsRaw].sort(compareFn);
    sortedChildren = [...childrenRaw].sort(compareFn);
  }

  return (
    <div>
      {/* Folder header with click-to-expand */}
      <div onClick={handleToggle} className="cursor-pointer select-none">
        {renderItem(
          {
            ...folder,
            folder_id: folder.parent_id,
            created_at: folder.created_at ?? "",
            __isFolder: true,
            __emoji: isExpanded ? "📂" : "📁",
            urgencyColor: "green",
          } as any,
          0,
          {
            selectMode:
              moveTargetSelectionMode && !selectedIds?.includes(folder.id)
                ? true
                : !moveTargetSelectionMode && selectMode,
            selectedIds,
            onSelectToggle: (id: string) => {
              if (onSelect) {
                onSelect(id, true);
              }
            },
          }
        )}
      </div>

      {isExpanded && (
        <div className="mt-1 space-y-1 border-b-4 border-[#111827] pb-2">
          <AddNewItem
            userId={folder.user_id}
            folderId={folder.id}
            caseId={folder.case_id}
            itemType={itemTypeFromListType(listType)}
            fileUploadEnabled={itemTypeFromListType(listType) === "document"}
            text={`New ${
              itemTypeFromListType(listType)[0].toUpperCase() +
              itemTypeFromListType(listType).slice(1)
            } in Folder ${emojiFromItemType[itemTypeFromListType(listType)]}`}
            onSuccess={() => {
              const itemType = itemTypeFromListType(listType);

              if (itemType === "case") {
                queryClient.invalidateQueries({
                  queryKey: ["cases", folder.user_id],
                });
              } else if (itemType === "document") {
                queryClient.invalidateQueries({
                  queryKey: ["documents", folder.user_id, folder.case_id],
                });
              } else if (itemType === "note") {
                queryClient.invalidateQueries({
                  queryKey: ["notes", folder.user_id, folder.case_id],
                });
              }
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

          {sortOption === "urgency" ? (
            <>
              {mixedSorted.map((entry, index) =>
                (entry as any).__isFolder ? (
                  <FolderTree
                    key={entry.id}
                    folder={entry}
                    items={items}
                    allFolders={allFolders}
                    renderItem={renderItem}
                    level={level + 1}
                    listType={listType}
                    sortOption={sortOption}
                    fileUploadEnabled={fileUploadEnabled}
                    selectMode={selectMode}
                    selectedIds={selectedIds}
                    onSelect={onSelect}
                    moveTargetSelectionMode={moveTargetSelectionMode}
                  />
                ) : (
                  renderItem(entry as T, index, {
                    selectMode:
                      moveTargetSelectionMode &&
                      !selectedIds?.includes(entry.id) &&
                      false === (entry as any).__isFolder
                        ? false
                        : moveTargetSelectionMode
                        ? (entry as any).__isFolder &&
                          !selectedIds?.includes(entry.id)
                        : selectMode,
                    selectedIds,
                    onSelectToggle: (id: string) => onSelect?.(id, false),
                  })
                )
              )}
            </>
          ) : (
            <>
              {sortedChildren.map((childFolder) => (
                <FolderTree
                  key={childFolder.id}
                  folder={childFolder}
                  items={items}
                  allFolders={allFolders}
                  renderItem={renderItem}
                  level={level + 1}
                  listType={listType}
                  sortOption={sortOption}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  fileUploadEnabled={fileUploadEnabled}
                  onSelect={onSelect}
                  moveTargetSelectionMode={moveTargetSelectionMode}
                />
              ))}
              {sortedFolderItems.map((item, index) =>
                renderItem(item, index, {
                  selectMode: moveTargetSelectionMode
                    ? false // ✅ NEVER allow item checkboxes in moveTarget mode
                    : selectMode,
                  selectedIds,
                  onSelectToggle: (id: string) => onSelect?.(id, false),
                })
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

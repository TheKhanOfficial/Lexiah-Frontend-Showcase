// components/list/List.tsx
import { ReactNode, useState, useEffect } from "react";
import { AddNewItem, ItemType } from "./AddNewItem";
import { AddNewFolder } from "./AddNewFolder";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllFolders } from "@/utils/supabase/folders";
import { deleteFoldersAndItems } from "@/utils/supabase/deleteMove";
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
  listType?: string;
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

function findFolderInTree(
  tree: FolderWithChildren[],
  id: string
): FolderWithChildren | null {
  for (const folder of tree) {
    if (folder.id === id) return folder;
    const foundInChildren = findFolderInTree(folder.children || [], id);
    if (foundInChildren) return foundInChildren;
  }
  return null;
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
  listType,
}: ListProps<T>) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortOption, setSortOption] = useState<
    "newest" | "oldest" | "alpha" | "urgency"
  >("urgency");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchSelectedOnly, setSearchSelectedOnly] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to recursively gather all nested folder & item ids
  function collectNestedIds(
    folderId: string,
    folders: Folder[],
    items: any[]
  ): string[] {
    const childFolderIds = folders
      .filter((f) => f.parent_id === folderId)
      .map((f) => f.id);

    const nestedIds = childFolderIds.flatMap((id) =>
      collectNestedIds(id, folders, items)
    );

    const childItemIds = items
      .filter((i) => i.folder_id === folderId)
      .map((i) => i.id);

    return [folderId, ...childItemIds, ...nestedIds];
  }

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

  const { data: fetchedFolders = [] } = useQuery({
    queryKey: ["folders", userId, listType],
    queryFn: () => fetchAllFolders(userId, listType),
  });

  const matchedFolders = searchQuery.trim()
    ? fetchedFolders.filter((folder) => {
        const matches = folder.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const isSelectedScope =
          !searchSelectedOnly || selectedIds.includes(folder.id);

        return matches && isSelectedScope;
      })
    : [];

  const parentMap = new Map<string, string | null>();
  fetchedFolders.forEach((f) => parentMap.set(f.id, f.parent_id));

  function getFolderChildren(folderId: string): string[] {
    const childFolderIds = fetchedFolders
      .filter((f) => f.parent_id === folderId)
      .map((f) => f.id);
    const childItemIds = sortedItems
      .filter((i) => i.folder_id === folderId)
      .map((i) => i.id);
    return [...childFolderIds, ...childItemIds];
  }

  function deselectParentChain(
    startFolderId: string,
    currentSelection: string[]
  ): string[] {
    let updatedSelection = [...currentSelection];
    let currentFolderId: string | null | undefined = startFolderId;

    while (currentFolderId) {
      updatedSelection = updatedSelection.filter(
        (id) => id !== currentFolderId
      );
      currentFolderId = parentMap.get(currentFolderId);
    }

    return updatedSelection;
  }

  function toggleSelect(id: string, isFolder: boolean) {
    let newSelected: string[];

    if (selectedIds.includes(id)) {
      // UNCHECK path
      if (isFolder) {
        const deselectIds = collectNestedIds(id, fetchedFolders, sortedItems);
        newSelected = selectedIds.filter((x) => !deselectIds.includes(x));
        // ❗ Recursively deselect all parent folders
        newSelected = deselectParentChain(id, newSelected);
      } else {
        newSelected = selectedIds.filter((x) => x !== id);

        // Get the folder this item belongs to
        const parentFolderId = sortedItems.find((i) => i.id === id)?.folder_id;
        if (parentFolderId) {
          newSelected = deselectParentChain(parentFolderId, newSelected);
        }
      }
    } else {
      // CHECK path
      if (isFolder) {
        const allIds = collectNestedIds(id, fetchedFolders, sortedItems);
        newSelected = [
          ...selectedIds,
          ...allIds.filter((x) => !selectedIds.includes(x)),
        ];
      } else {
        newSelected = [...selectedIds, id];
      }
    }

    setSelectedIds(newSelected);
  }

  const folderTree: FolderWithChildren[] = buildFolderTree(
    fetchedFolders
  ) as FolderWithChildren[];

  const filteredItems = searchQuery.trim()
    ? items.filter((item) => {
        const matches = (item as any)?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
        const isSelectedScope =
          !searchSelectedOnly || selectedIds.includes(item.id);

        return matches && isSelectedScope;
      })
    : sortedItems;

  const filteredResults =
    searchQuery.trim() === ""
      ? []
      : [
          ...matchedFolders.map((folder) => ({
            ...folder,
            __isFolder: true,
            created_at: folder.created_at ?? "",
            name: folder.name,
          })),
          ...filteredItems.map((item) => ({
            ...item,
            __isFolder: false,
            created_at: (item as any).created_at ?? "",
            name: (item as any).name ?? "",
          })),
        ];

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

  const normalizedData = [
    ...folderTree.map((folder) => ({
      ...folder,
      __isFolder: true,
      created_at: folder.created_at ?? "",
      name: folder.name,
    })),
    ...sortedItems
      .filter((item) => !(item as any).folder_id) // ✅ EXCLUDE nested items
      .map((item) => ({
        ...item,
        __isFolder: false,
        created_at: (item as any).created_at ?? "",
        name: (item as any).name ?? "",
      })),
  ];

  const finalSortedList = [...normalizedData].sort((a, b) => {
    if (sortOption === "urgency") {
      // TEMP: Just default to time desc, folders & items mixed
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return timeB - timeA;
    }

    // FOLDERS FIRST
    if (a.__isFolder && !b.__isFolder) return -1;
    if (!a.__isFolder && b.__isFolder) return 1;

    if (sortOption === "newest") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOption === "oldest") {
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortOption === "alpha") {
      return a.name.localeCompare(b.name);
    }

    return 0; // fallback
  });

  useEffect(() => {
    if (searchInput.trim() === "") {
      setSearchQuery("");
    }
  }, [searchInput]);

  const handleDeleteConfirmed = async () => {
    try {
      setIsDeleting(true);

      const folderIdsToDelete = selectedIds.filter((id) =>
        fetchedFolders.some((f) => f.id === id)
      );

      const itemIdsToDelete = selectedIds.filter((id) =>
        items.some((item) => item.id === id)
      );

      await deleteFoldersAndItems({
        folderIds: folderIdsToDelete,
        itemIds: itemIdsToDelete,
        listType: listType === "cases" ? "cases" : "notes",
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["folders", userId, listType],
        }),
        queryClient.invalidateQueries({ queryKey: [listType, userId] }),
      ]);

      // Reset UI
      setSelectedIds([]);
      setSelectMode(false);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setIsDeleting(false);
    }
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
          <AddNewFolder
            userId={userId}
            caseId={caseId ?? null}
            listType={listType}
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
              placeholder={
                selectMode && selectedIds.length > 0 && searchSelectedOnly
                  ? "Search selected items"
                  : "Search"
              }
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

        <div className="flex items-center justify-between mt-1 px-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            className="text-sm border-gray-300 rounded-md shadow-sm"
            value={sortOption}
            onChange={(e) =>
              setSortOption(
                e.target.value as "newest" | "oldest" | "alpha" | "urgency"
              )
            }
          >
            <option value="urgency">Urgency (default)</option>
            <option value="newest">Time: Newest to Oldest</option>
            <option value="oldest">Time: Oldest to Newest</option>
            <option value="alpha">Alphabetical</option>
          </select>

          <button
            onClick={() => {
              if (selectMode) {
                setSelectedIds([]); // ✅ Clear all selections when canceling
                setSearchSelectedOnly(false);
              }
              setSelectMode(!selectMode);
            }}
            className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>
        {selectMode && selectedIds.length > 0 && (
          <div className="flex items-center space-x-2 mt-2 px-2">
            <span className="text-sm font-medium text-gray-700">Actions:</span>

            <button
              className={`px-2 py-1 text-sm border rounded ${
                searchSelectedOnly
                  ? "bg-black text-white border-black"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
              onClick={() => setSearchSelectedOnly((prev) => !prev)}
            >
              Search
            </button>

            <button
              className="px-2 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-50"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </button>

            <button
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-500 cursor-not-allowed"
              disabled
            >
              Move
            </button>
          </div>
        )}

        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="animate-spin rounded-full h-8 w-8"></div>
            </div>
          ) : searchQuery.trim() !== "" ? (
            filteredResults.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4 text-gray-500">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredResults.map((entry, index) =>
                  entry.__isFolder ? (
                    <FolderTree
                      key={entry.id}
                      folder={
                        findFolderInTree(folderTree, entry.id) || (entry as any)
                      }
                      items={items}
                      allFolders={fetchedFolders}
                      renderItem={renderItem}
                      level={1}
                      listType={listType}
                      sortOption={sortOption}
                      selectMode={selectMode}
                      selectedIds={selectedIds}
                      onSelect={toggleSelect}
                    />
                  ) : (
                    renderItem(entry, index, {
                      selectMode,
                      selectedIds,
                      onSelectToggle: (id: string, isFolder: boolean) =>
                        toggleSelect(id, isFolder),
                    })
                  )
                )}
              </div>
            )
          ) : finalSortedList.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-1">
              {finalSortedList.map((entry, index) =>
                entry.__isFolder ? (
                  <FolderTree
                    key={entry.id}
                    folder={
                      findFolderInTree(folderTree, entry.id) || (entry as any)
                    }
                    items={items}
                    allFolders={fetchedFolders}
                    renderItem={renderItem}
                    level={1}
                    listType={listType}
                    sortOption={sortOption}
                    selectMode={selectMode}
                    selectedIds={selectedIds}
                    onSelect={toggleSelect}
                  />
                ) : (
                  renderItem(entry, index, {
                    selectMode,
                    selectedIds,
                    onSelectToggle: (id: string, isFolder: boolean) =>
                      toggleSelect(id, isFolder),
                  })
                )
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-md mx-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2">
              Are you absolutely sure?
            </h2>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently remove the
              selected items and folders from your account and our servers.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full disabled:bg-opacity-50 flex items-center justify-center"
                onClick={handleDeleteConfirmed}
                disabled={isDeleting}
              >
                {isDeleting ? (
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
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

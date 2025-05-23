"use client";
// app/components/NoteWorkspace.tsx

import { useState } from "react";
import { List } from "@/app/components/list/List";
import { ListItem } from "@/app/components/list/ListItem";
import { RenameDeleteModal } from "@/app/components/modals/RenameDeleteModal";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotes, renameNote, deleteNote } from "@/utils/supabase";

// Define Note type
interface Note {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  content?: string;
}

interface NoteWorkspaceProps {
  userId: string;
  caseId: string;
  onSelectNote?: (id: string) => void;
}

export default function NoteWorkspace({
  userId,
  caseId,
  onSelectNote,
}: NoteWorkspaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch notes with React Query
  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notes", userId, caseId],
    queryFn: () => fetchNotes(userId, caseId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!caseId,
  });

  // Mutations
  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notes", userId, caseId],
      });
      setShowDeleteModal(false);
    },
  });

  const renameNoteMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      renameNote(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notes", userId, caseId],
      });
      setShowRenameModal(false);
    },
  });

  // Handle note addition
  const handleNoteAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["notes", userId, caseId] });
  };

  // Handle rename request
  const handleRenameRequest = (id: string) => {
    const noteToRename = notes.find((note) => note.id === id);
    if (noteToRename) {
      setSelectedNoteId(id);
      setRenameValue(noteToRename.name);
      setShowRenameModal(true);
      setModalError(null);
    }
  };

  // Handle delete request
  const handleDeleteRequest = (id: string) => {
    setSelectedNoteId(id);
    setShowDeleteModal(true);
    setModalError(null);
  };

  // Handle confirming deletion
  const handleConfirmDelete = async () => {
    if (isModalLoading || !selectedNoteId) return;

    setIsModalLoading(true);
    setModalError(null);

    try {
      await deleteNoteMutation.mutateAsync(selectedNoteId);
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "An error occurred while deleting"
      );
    } finally {
      setIsModalLoading(false);
    }
  };

  // Handle confirming rename
  const handleConfirmRename = async () => {
    if (
      isModalLoading ||
      !selectedNoteId ||
      renameValue.trim() === "" ||
      renameValue.trim() === notes.find((n) => n.id === selectedNoteId)?.name
    )
      return;

    setIsModalLoading(true);
    setModalError(null);

    try {
      await renameNoteMutation.mutateAsync({
        id: selectedNoteId,
        newName: renameValue.trim(),
      });
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "An error occurred while renaming"
      );
    } finally {
      setIsModalLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle errors from AddNewItem
  const handleAddItemError = (error: Error) => {
    // Pass through
  };

  // Handle note click - now uses the onSelectNote prop instead of navigation
  const handleNoteClick = (noteId: string) => {
    if (onSelectNote) {
      onSelectNote(noteId);
    } else {
      // Fallback to router if no handler provided
      router.push(`/${userId}/${caseId}/notes/${noteId}`);
    }
  };

  // Render the note list
  const renderNotesList = () => {
    if (error) {
      return (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error loading notes
          </h3>
          <p className="text-red-700">{(error as Error).message}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-100 border border-red-300 text-red-800 rounded-md hover:bg-red-200"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["notes", userId, caseId],
              })
            }
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <List
        title="Notes"
        items={notes}
        userId={userId}
        caseId={caseId}
        itemType="note"
        onItemAdded={handleNoteAdded}
        onAddItemError={handleAddItemError}
        addItemText="New Note"
        fileUploadEnabled={false}
        sortBy="updated_at"
        sortDirection="desc"
        isLoading={isLoading}
        emptyMessage="No notes yet. Add your first note to get started."
        renderItem={(note) => (
          <div
            key={note.id}
            className="block cursor-pointer"
            onClick={() => handleNoteClick(note.id)}
          >
            <ListItem
              id={note.id}
              userId={userId}
              itemType="note"
              title={note.name}
              subtitle={`Updated: ${formatDate(
                note.updated_at || note.created_at
              )}`}
              onRename={handleRenameRequest}
              onDelete={handleDeleteRequest}
            />
          </div>
        )}
      />
    );
  };

  // Find the selected note name for display in modal
  const selectedNoteName =
    notes.find((n) => n.id === selectedNoteId)?.name || "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">{renderNotesList()}</div>

      {/* Modals */}
      {showDeleteModal && (
        <RenameDeleteModal
          showModal={true}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          isLoading={isModalLoading}
          modalError={modalError}
          type="delete"
          itemType="note"
          itemName={selectedNoteName}
        />
      )}

      {showRenameModal && (
        <RenameDeleteModal
          showModal={true}
          onClose={() => setShowRenameModal(false)}
          onConfirm={handleConfirmRename}
          isLoading={isModalLoading}
          modalError={modalError}
          type="rename"
          itemType="note"
          itemName={selectedNoteName}
          inputValue={renameValue}
          setInputValue={setRenameValue}
        />
      )}
    </div>
  );
}

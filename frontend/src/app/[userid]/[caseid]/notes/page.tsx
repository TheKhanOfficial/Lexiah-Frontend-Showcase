"use client";
// app/[userid]/[caseid]/notes/page.tsx

import { useState } from "react";
import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";
import { InputBar } from "@/app/components/InputBar";
import { List } from "@/app/components/list/List";
import { ListItem } from "@/app/components/list/ListItem";
import { RenameDeleteModal } from "@/app/components/modals/RenameDeleteModal";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotes, renameNote, deleteNote } from "@/utils/supabase";
import Link from "next/link";

// Define Note type with file support
interface Note {
  id: string;
  user_id: string;
  case_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  public_url?: string;
}

export default function NotesPage() {
  const router = useRouter();
  const params = useParams();
  const userId =
    (params.userid as string) || "53917586-97ad-49b6-9bd6-51c441316425"; // Fallback to test user ID
  const caseId = params.caseid as string;

  // React Query client
  const queryClient = useQueryClient();

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const tabs = [
    { id: "documents", label: "Documents", path: "documents" },
    { id: "notes", label: "Notes", path: "notes" },
    { id: "chat", label: "Chat", path: "chat" },
  ];

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
      renameValue.trim() ===
        notes.find((note) => note.id === selectedNoteId)?.name
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle chat input
  const handleInputSubmit = async (text: string, isDocumentSearch: boolean) => {
    // Encode the text to be safe in a URL
    const encodedText = encodeURIComponent(text);

    // Navigate to chat with the text as a search parameter
    router.push(`/${userId}/${caseId}/chat?message=${encodedText}`);
  };

  // Handle errors from AddNewItem
  const handleAddItemError = (error: Error) => {
    console.error("Error adding note:", error);
  };

  // Render the notes list
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
        addItemText="Add New Note"
        sortBy="created_at"
        sortDirection="desc"
        isLoading={isLoading}
        emptyMessage="No notes yet. Add your first note to get started."
        fileUploadEnabled={true}
        fileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        renderItem={(note) => (
          <Link
            href={`/${userId}/${caseId}/notes/${note.id}`}
            key={note.id}
            className="block"
          >
            <ListItem
              id={note.id}
              userId={userId}
              itemType="note"
              title={note.name}
              subtitle={`Created: ${formatDate(note.created_at)}`}
              onRename={handleRenameRequest}
              onDelete={handleDeleteRequest}
              rightContent={
                note.file_type ? (
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded-md">
                    {note.file_type.split("/").pop()?.toUpperCase()}
                  </span>
                ) : note.updated_at && note.updated_at !== note.created_at ? (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                    Updated
                  </span>
                ) : null
              }
            />
          </Link>
        )}
      />
    );
  };

  // Find the selected note name for display in modal
  const selectedNoteName =
    notes.find((n) => n.id === selectedNoteId)?.name || "";

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        <div className="flex-1 overflow-auto">{renderNotesList()}</div>

        <InputBar onSubmit={handleInputSubmit} />
      </div>

      {/* Delete modal */}
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

      {/* Rename modal */}
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
    </MainLayout>
  );
}

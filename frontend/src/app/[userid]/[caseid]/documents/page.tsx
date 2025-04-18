"use client";
// app/[userid]/[caseid]/documents/page.tsx

import { useState } from "react";
import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";
import { InputBar } from "@/app/components/InputBar";
import { List } from "@/app/components/list/List";
import { ListItem } from "@/app/components/list/ListItem";
import { RenameDeleteModal } from "@/app/components/modals/RenameDeleteModal";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments,
  renameDocument,
  deleteDocument,
} from "@/utils/supabase";
import Link from "next/link";

// Define Document type
interface Document {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  public_url?: string;
}

export default function DocumentsPage() {
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
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const tabs = [
    { id: "documents", label: "Documents", path: "documents" },
    { id: "notes", label: "Notes", path: "notes" },
    { id: "chat", label: "Chat", path: "chat" },
  ];

  // Fetch documents with React Query
  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["documents", userId, caseId],
    queryFn: () => fetchDocuments(userId, caseId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!caseId,
  });

  // Mutations
  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents", userId, caseId],
      });
      setShowDeleteModal(false);
    },
  });

  const renameDocumentMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      renameDocument(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents", userId, caseId],
      });
      setShowRenameModal(false);
    },
  });

  // Handle document addition
  const handleDocumentAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["documents", userId, caseId] });
  };

  // Handle rename request
  const handleRenameRequest = (id: string) => {
    const documentToRename = documents.find((doc) => doc.id === id);
    if (documentToRename) {
      setSelectedDocumentId(id);
      setRenameValue(documentToRename.name);
      setShowRenameModal(true);
      setModalError(null);
    }
  };

  // Handle delete request
  const handleDeleteRequest = (id: string) => {
    setSelectedDocumentId(id);
    setShowDeleteModal(true);
    setModalError(null);
  };

  // Handle confirming deletion
  const handleConfirmDelete = async () => {
    console.log(`Deleted!`);
    if (isModalLoading || !selectedDocumentId) return;

    setIsModalLoading(true);
    setModalError(null);

    try {
      await deleteDocumentMutation.mutateAsync(selectedDocumentId);
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
    console.log(
      "Renaming Document:",
      selectedDocumentId,
      "New name:",
      renameValue
    );

    if (
      isModalLoading ||
      !selectedDocumentId ||
      renameValue.trim() === "" ||
      renameValue.trim() ===
        documents.find((d) => d.id === selectedDocumentId)?.name
    )
      return;

    setIsModalLoading(true);
    setModalError(null);

    try {
      await renameDocumentMutation.mutateAsync({
        id: selectedDocumentId,
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

  // Handle chat input
  const handleInputSubmit = async (text: string, isDocumentSearch: boolean) => {
    // Encode the text to be safe in a URL
    const encodedText = encodeURIComponent(text);

    // Navigate to chat with the text as a search parameter
    router.push(`/${userId}/${caseId}/chat?message=${encodedText}`);
  };

  // Handle errors from AddNewItem
  const handleAddItemError = (error: Error) => {
    // Pass through
  };

  // Render the document list
  const renderDocumentsList = () => {
    if (error) {
      return (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error loading documents
          </h3>
          <p className="text-red-700">{(error as Error).message}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-100 border border-red-300 text-red-800 rounded-md hover:bg-red-200"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["documents", userId, caseId],
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
        title="Documents"
        items={documents}
        userId={userId}
        caseId={caseId}
        itemType="document"
        onItemAdded={handleDocumentAdded}
        onAddItemError={handleAddItemError}
        addItemText="Add New Document"
        fileUploadEnabled={true}
        sortBy="created_at"
        sortDirection="desc"
        isLoading={isLoading}
        emptyMessage="No documents yet. Add your first document to get started."
        renderItem={(document) => (
          <Link
            href={`/${userId}/${caseId}/documents/${document.id}`}
            key={document.id}
            className="block"
          >
            <ListItem
              id={document.id}
              userId={userId}
              itemType="document"
              title={document.name}
              subtitle={`Added: ${formatDate(document.created_at)}`}
              onRename={handleRenameRequest}
              onDelete={handleDeleteRequest}
              rightContent={
                document.file_type && (
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded-md">
                    {document.file_type.split("/").pop()?.toUpperCase()}
                  </span>
                )
              }
            />
          </Link>
        )}
      />
    );
  };

  // Find the selected document name for display in modal
  const selectedDocumentName =
    documents.find((d) => d.id === selectedDocumentId)?.name || "";

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        <div className="flex-1 overflow-auto">{renderDocumentsList()}</div>

        <InputBar onSubmit={handleInputSubmit} />
      </div>

      {/* Replace inline modals with our new component */}
      {showDeleteModal && (
        <RenameDeleteModal
          showModal={true}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          isLoading={isModalLoading}
          modalError={modalError}
          type="delete"
          itemType="document"
          itemName={selectedDocumentName}
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
          itemType="document"
          itemName={selectedDocumentName}
          inputValue={renameValue}
          setInputValue={setRenameValue}
        />
      )}
    </MainLayout>
  );
}

"use client";
// app/[userid]/[caseid]/documents/page.tsx

import { useState, useEffect } from "react";
import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";
import { InputBar } from "@/app/components/InputBar";
import { List } from "@/app/components/list/List";
import { ListItem } from "@/app/components/list/ListItem";
import { useRouter, useParams } from "next/navigation";
import { fetchDocuments } from "@/utils/supabase";
import Link from "next/link";

// Define Document type
interface Document {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
}

export default function DocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const userId =
    (params.userid as string) || "53917586-97ad-49b6-9bd6-51c441316425"; // Fallback to test user ID
  const caseId = params.caseid as string;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: "documents", label: "Documents", path: "documents" },
    { id: "notes", label: "Notes", path: "notes" },
    { id: "chat", label: "Chat", path: "chat" },
  ];

  // Load documents on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      if (!caseId) return;

      setIsLoading(true);
      setError(null);

      try {
        const fetchedDocuments = await fetchDocuments(userId, caseId);
        setDocuments(fetchedDocuments);
      } catch (err) {
        console.error("Error loading documents:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [userId, caseId]);

  // Handle document addition
  const handleDocumentAdded = (newDocument: Document) => {
    setDocuments((prevDocs) => [newDocument, ...prevDocs]);
  };

  // Handle document rename
  const handleDocumentRenamed = (id: string, newName: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => (doc.id === id ? { ...doc, name: newName } : doc))
    );
  };

  // Handle document deletion
  const handleDocumentDeleted = (id: string) => {
    setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== id));
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

  // Render the document list or empty state
  const renderDocumentsList = () => {
    if (error) {
      return (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error loading documents
          </h3>
          <p className="text-red-700">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-100 border border-red-300 text-red-800 rounded-md hover:bg-red-200"
            onClick={() => window.location.reload()}
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
              onRenameSuccess={handleDocumentRenamed}
              onDeleteSuccess={handleDocumentDeleted}
              rightContent={
                document.file_type && (
                  <span className="px-2 py-1 text-xs bg-gray-100 rounded-md">
                    {document.file_type.toUpperCase()}
                  </span>
                )
              }
            />
          </Link>
        )}
      />
    );
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        <div className="flex-1 overflow-auto">{renderDocumentsList()}</div>

        <InputBar onSubmit={handleInputSubmit} />
      </div>
    </MainLayout>
  );
}

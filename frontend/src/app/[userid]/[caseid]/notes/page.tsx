"use client";
// app/[userid]/[caseid]/notes/page.tsx

import { useState, useEffect } from "react";
import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";
import { InputBar } from "@/app/components/InputBar";
import { List } from "@/app/components/list/List";
import { ListItem } from "@/app/components/list/ListItem";
import { useRouter, useParams } from "next/navigation";
import { fetchNotes } from "@/utils/supabase";
import Link from "next/link";

// Define Note type
interface Note {
  id: string;
  user_id: string;
  case_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export default function NotesPage() {
  const router = useRouter();
  const params = useParams();
  const userId =
    (params.userid as string) || "53917586-97ad-49b6-9bd6-51c441316425"; // Fallback to test user ID
  const caseId = params.caseid as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: "documents", label: "Documents", path: "documents" },
    { id: "notes", label: "Notes", path: "notes" },
    { id: "chat", label: "Chat", path: "chat" },
  ];

  // Load notes on component mount
  useEffect(() => {
    const loadNotes = async () => {
      if (!caseId) return;

      setIsLoading(true);
      setError(null);

      try {
        const fetchedNotes = await fetchNotes(userId, caseId);
        setNotes(fetchedNotes);
      } catch (err) {
        console.error("Error loading notes:", err);
        setError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [userId, caseId]);

  // Handle note addition
  const handleNoteAdded = (newNote: Note) => {
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  // Handle note rename
  const handleNoteRenamed = (id: string, newName: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, name: newName } : note
      )
    );
  };

  // Handle note deletion
  const handleNoteDeleted = (id: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
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

  // Render the notes list or empty state
  const renderNotesList = () => {
    if (error) {
      return (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error loading notes
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
        title="Notes"
        items={notes}
        userId={userId}
        caseId={caseId}
        itemType="note"
        onItemAdded={handleNoteAdded}
        addItemText="Add New Note"
        sortBy="created_at"
        sortDirection="desc"
        isLoading={isLoading}
        emptyMessage="No notes yet. Add your first note to get started."
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
              onRenameSuccess={handleNoteRenamed}
              onDeleteSuccess={handleNoteDeleted}
              rightContent={
                note.updated_at && note.updated_at !== note.created_at ? (
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

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        <div className="flex-1 overflow-auto">{renderNotesList()}</div>

        <InputBar onSubmit={handleInputSubmit} />
      </div>
    </MainLayout>
  );
}

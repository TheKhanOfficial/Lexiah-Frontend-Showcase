"use client";
// app/[userid]/[caseid]/notes/[noteid]/page.tsx

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph } from "docx";
import { MainLayout } from "@/app/components/MainLayout";
import { InputBar } from "@/app/components/InputBar";
import { ToggleHideShow } from "@/app/components/ToggleHideShow";
import dynamic from "next/dynamic";

// Dynamically import Tiptap components to prevent hydration errors
const NoteEditor = dynamic(() => import("@/app/components/NoteEditor"), {
  ssr: false, // Disable server-side rendering for TipTap
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  ),
});

interface NoteData {
  id: string;
  name: string;
  text_content: string;
  created_at: string;
}

export default function NoteEditorPage() {
  if (typeof window === "undefined") return null;

  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.userid as string;
  const caseId = params.caseid as string;
  const noteId = params.noteid as string;

  const [noteContent, setNoteContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAIAdvice, setShowAIAdvice] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1.0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch note data
  const { data: note, isLoading: isLoadingMeta } = useQuery<NoteData>({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Set initial content when note data is loaded
  useEffect(() => {
    if (note) {
      setNoteContent(note.text_content || "");
      setLoading(false);
    }
  }, [note]);

  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from("notes")
        .update({
          text_content: content,
        })
        .eq("id", noteId)
        .select();

      console.log(`Save result: `, { data, error });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    },
    onError: (error) => {
      console.error("Error saving note:", error?.message || error);
      setIsSaving(false);
    },
  });

  // Autosave effect
  useEffect(() => {
    if (!noteId || !noteContent || isLoadingMeta || loading) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout to save after delay
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      saveNoteMutation.mutate(noteContent);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [noteContent, noteId, isLoadingMeta, loading]);

  // Manual save function
  const handleSave = () => {
    if (!noteId || !noteContent || isSaving) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    setIsSaving(true);
    saveNoteMutation.mutate(noteContent);
  };

  // Export to docx
  const exportToDocx = () => {
    // Strip HTML tags for plain text export
    const plainText = noteContent.replace(/<[^>]+>/g, "");

    const doc = new Document({
      sections: [
        {
          children: [new Paragraph(plainText)],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${note?.name || "Note"}.docx`);
    });
  };

  // Handle chat input submission
  const handleInputSubmit = (text: string, isDocumentSearch: boolean) => {
    // Encode the text to be safe in a URL
    const encodedText = encodeURIComponent(text);

    // Navigate to chat with the text as a search parameter
    router.push(`/${userId}/${caseId}/chat?message=${encodedText}`);
  };

  // Zoom controls
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1);

  // Toggle AI Advice panel
  const toggleAIAdvice = () => {
    setShowAIAdvice(!showAIAdvice);
  };

  // Handle close button click - navigate back to notes page
  const handleClose = () => {
    router.push(`/${userId}/${caseId}/notes`);
  };

  // Format date for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Render loading state
  if (isLoadingMeta || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !note) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading note
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || "Note not found"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Close button - positioned relative to the work window */}
        <div className="absolute top-12 right-12 z-50">
          <button
            onClick={handleClose}
            className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-md"
            aria-label="Close note"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Split view container */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Note Editor with auto-sizing */}
          <div className={showAIAdvice ? "auto" : "w-full"}>
            {/* Note toolbar */}
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-sm font-medium text-gray-700 truncate max-w-xs md:max-w-md">
                  {note.name}
                </h3>
                <div className="text-xs text-gray-500">
                  {isSaving ? (
                    <span className="text-amber-600">Saving...</span>
                  ) : lastSaved ? (
                    <span className="text-green-600">
                      Saved at {formatTime(lastSaved)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <div className="h-6 border-l border-gray-300 mx-2"></div>
                <button
                  onClick={zoomOut}
                  className="p-1 rounded-md hover:bg-gray-200"
                  aria-label="Zoom out"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={resetZoom}
                  className="text-xs px-2 py-1 rounded-md hover:bg-gray-200"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={zoomIn}
                  className="p-1 rounded-md hover:bg-gray-200"
                  aria-label="Zoom in"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <button
                  onClick={exportToDocx}
                  className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                >
                  Export to .docx
                </button>
              </div>
            </div>

            <div
              ref={viewerContainerRef}
              className="h-full overflow-auto bg-gray-100"
              style={{ padding: "20px" }}
            >
              <div
                className="mx-auto"
                style={{
                  width: `${8.5 * scale}in`,
                  minHeight: "11in",
                  transformOrigin: "top center",
                }}
              >
                <NoteEditor content={noteContent} onChange={setNoteContent} />
              </div>
            </div>
          </div>

          {/* Toggle button and AI Advice */}
          {showAIAdvice ? (
            <div className="auto h-full relative">
              {/* Toggle button positioned higher up */}
              <div className="absolute left-0 top-24 -ml-7 z-10">
                <ToggleHideShow
                  isVisible={showAIAdvice}
                  onToggle={toggleAIAdvice}
                  hiddenDirection="left"
                  visibleDirection="right"
                />
              </div>

              {/* AI Advice content */}
              <div className="h-full border-l border-gray-300 overflow-auto bg-white p-4">
                <div className="h-full flex items-center justify-center text-xl font-semibold text-gray-500">
                  AI ADVICE PLACEHOLDER 🧠
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute right-0 top-24 z-10">
              <ToggleHideShow
                isVisible={showAIAdvice}
                onToggle={toggleAIAdvice}
                hiddenDirection="left"
                visibleDirection="right"
              />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <InputBar onSubmit={handleInputSubmit} />
      </div>
    </MainLayout>
  );
}

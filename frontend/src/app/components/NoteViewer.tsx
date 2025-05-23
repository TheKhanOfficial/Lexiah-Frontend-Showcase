"use client";
//app/components/NoteViewer.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { debounce } from "lodash";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

interface Note {
  id: string;
  name: string;
  text_content?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  case_id?: string;
}

interface NoteViewerProps {
  userId: string;
  caseId: string;
  noteId: string;
  onClose: () => void;
}

export default function NoteViewer({
  userId,
  caseId,
  noteId,
  onClose,
}: NoteViewerProps) {
  console.log("NoteViewer props", { noteId, userId, caseId });
  if (!noteId || !userId || !caseId) {
    return (
      <div className="text-red-600 p-4">
        Missing required props: noteId, userId, or caseId.
      </div>
    );
  }

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved"
  );
  const queryClient = useQueryClient();

  // Add scale state for zoom functionality
  const [scale, setScale] = useState<number>(1.0);

  const {
    data: note,
    isLoading,
    error,
  } = useQuery<Note>({
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
    enabled: !!noteId, // <- ✅ ONLY RUN ONCE noteId IS READY
  });

  const hasInitializedContent = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing your note here...",
      }),
      Typography,
      Highlight,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: true,
      }),
    ],
    content: "", // empty at start
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none p-4",
      },
    },
  });

  useEffect(() => {
    if (!editor || !note?.text_content || hasInitializedContent.current) return;

    const editorContent = editor.getHTML();

    // Only set once, and only if different
    if (editorContent.trim() !== note.text_content.trim()) {
      editor.commands.setContent(note.text_content, false); // no history entry
    }

    hasInitializedContent.current = true;
  }, [editor, note?.text_content]);

  // Improved save mutation that logs more details
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!noteId || !userId || !caseId) {
        console.error("Missing noteId/userId/caseId for save mutation");
        throw new Error("Missing IDs for Supabase update");
      }

      if (!content || content === note?.text_content) {
        console.log("No changes to save.");
        return;
      }

      console.log("Saving to Supabase with content length:", content.length);

      const { data, error } = await supabase
        .from("notes")
        .update({ text_content: content })
        .eq("id", noteId)
        .select()
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log("Supabase update succeeded:", data);
      return data;
    },

    onMutate: () => setSaveStatus("saving"),
    onError: (error) => {
      console.error("Save mutation error:", error);
      setSaveStatus("error");
    },
    onSuccess: (data) => {
      console.log("Save mutation success, data:", data);
      setSaveStatus("saved");
      queryClient.setQueryData(["note", noteId], data);
    },
  });

  // Create a debounced save function properly
  const debouncedSaveRef = useRef<(content: string) => void>(() => {});

  useEffect(() => {
    debouncedSaveRef.current = debounce((content: string) => {
      if (!noteId || !userId || !caseId) {
        console.warn("Skipping debounced save: missing IDs");
        return;
      }
      console.log("Debounced save (safe) triggering:", content);
      saveMutation.mutate(content);
    }, 1000);
  }, [saveMutation]);

  // Fixed editor update listener
  useEffect(() => {
    if (!editor) return;

    editor.on("update", () => {
      setSaveStatus("saving");
      debouncedSaveRef.current(editor.getHTML());
    });

    return () => {
      editor.off("update");
      debouncedSaveRef.current?.cancel?.();
    };
  }, [editor]);

  // Add zoom functions
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1);

  // Add export to docx function
  const exportToDocx = () => {
    if (!editor || !note) return;

    // Strip HTML tags for plain text export
    const plainText = editor.getText();
    console.log("Exporting to DOCX, content length:", plainText.length);

    const doc = new Document({
      sections: [
        {
          children: [new Paragraph(plainText)],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${note.name || "Note"}.docx`);
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
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
              <p className="mt-2 text-sm text-red-700">
                {(error as Error)?.message || "Note not found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Close button */}

      <div className="absolute top-8 right-4 z-10">
        <button
          onClick={onClose}
          className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-md"
          aria-label="Close note"
        >
          <svg
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

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-full">
          {/* Toolbar */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-medium text-gray-700 truncate max-w-xs md:max-w-md">
                {note.name}
              </h3>
              <div className="text-xs text-gray-500">
                {saveStatus === "saved" && (
                  <span className="text-green-600">Saved</span>
                )}
                {saveStatus === "saving" && (
                  <span className="text-yellow-600">Saving...</span>
                )}
                {saveStatus === "error" && (
                  <span className="text-red-600">Error saving</span>
                )}
              </div>
            </div>

            {/* Added zoom controls and export button to toolbar */}
            <div className="flex items-center space-x-2">
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
                onClick={() => {
                  if (!noteId || !userId || !caseId) {
                    console.error("Cannot save: Missing IDs");
                    return;
                  }

                  if (editor) {
                    const content = editor.getHTML();
                    saveMutation.mutate(content);
                  }
                }}
                className="text-xs px-3 py-1 bg-red-50 text-red-500 rounded-md hover:bg-red-100 disabled:opacity-50"
              >
                Save
              </button>

              <div className="h-6 border-l border-gray-300 mx-2"></div>
              <button
                onClick={exportToDocx}
                className="text-xs px-2 py-1 bg-red-100 text-red-500 rounded-md hover:bg-red-200"
              >
                Export to .docx
              </button>
            </div>
          </div>

          {/* Editor content with scale transform */}
          <div className="flex-1 overflow-auto bg-gray-100 flex justify-center py-8 px-4">
            <div
              className="bg-white shadow-md p-8 rounded-md w-[8.5in] min-h-[11in] max-w-full"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top center",
              }}
            >
              {editor ? (
                <EditorContent editor={editor} />
              ) : (
                <div className="text-[#111827] text-center">
                  Loading editor...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

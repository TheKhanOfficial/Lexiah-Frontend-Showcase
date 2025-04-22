"use client";
// app/components/NoteEditor.tsx

import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { useEffect } from "react";

interface NoteEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function NoteEditor({ content, onChange }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[11in] p-8 bg-white",
      },
    },
    // 🧠 This is the key fix:
    autofocus: false,
    editable: true,
    injectCSS: true,
    immediatelyRender: false, // <== ADD THIS TO FIX SSR HYDRATION ERROR
  });

  // Update editor content when prop changes (e.g., when note is loaded)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  //   // Add simple formatting toolbar
  //   const toolbar = (
  //     <div className="border-b border-gray-200 bg-white p-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
  //       <button
  //         onClick={() => editor?.chain().focus().toggleBold().run()}
  //         className={`p-1 rounded ${
  //           editor?.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
  //         }`}
  //         title="Bold"
  //       >
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           viewBox="0 0 24 24"
  //           width="24"
  //           height="24"
  //           className="w-5 h-5"
  //         >
  //           <path fill="none" d="M0 0h24v24H0z" />
  //           <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z" />
  //         </svg>
  //       </button>

  //       <button
  //         onClick={() => editor?.chain().focus().toggleItalic().run()}
  //         className={`p-1 rounded ${
  //           editor?.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
  //         }`}
  //         title="Italic"
  //       >
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           viewBox="0 0 24 24"
  //           width="24"
  //           height="24"
  //           className="w-5 h-5"
  //         >
  //           <path fill="none" d="M0 0h24v24H0z" />
  //           <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z" />
  //         </svg>
  //       </button>

  //       <button
  //         onClick={() => editor?.chain().focus().toggleStrike().run()}
  //         className={`p-1 rounded ${
  //           editor?.isActive("strike") ? "bg-gray-200" : "hover:bg-gray-100"
  //         }`}
  //         title="Strikethrough"
  //       >
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           viewBox="0 0 24 24"
  //           width="24"
  //           height="24"
  //           className="w-5 h-5"
  //         >
  //           <path fill="none" d="M0 0h24v24H0z" />
  //           <path d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.87-1.144V16.6c1.52.877 3.075 1.316 4.666 1.316 2.551 0 3.83-.732 3.839-2.197a2.21 2.21 0 0 0-.648-1.603l-.12-.117H3v-2h18v2h-3.846zm-4.078-3H7.629a4.086 4.086 0 0 1-.481-.522C6.716 9.92 6.5 9.246 6.5 8.452c0-1.236.466-2.287 1.397-3.153C8.83 4.433 10.271 4 12.222 4c1.471 0 2.879.328 4.222.984v2.152c-1.2-.687-2.515-1.03-3.946-1.03-2.48 0-3.719.782-3.719 2.346 0 .42.218.786.654 1.099.436.313.974.562 1.613.75.62.18 1.297.414 2.03.699z" />
  //         </svg>
  //       </button>

  //       <div className="h-6 border-l border-gray-300 mx-2"></div>

  //       <button
  //         onClick={() =>
  //           editor?.chain().focus().toggleHeading({ level: 1 }).run()
  //         }
  //         className={`p-1 rounded ${
  //           editor?.isActive("heading", { level: 1 })
  //             ? "bg-gray-200"
  //             : "hover:bg-gray-100"
  //         }`}
  //         title="Heading 1"
  //       >
  //         <span className="font-bold">H1</span>
  //       </button>

  //       <button
  //         onClick={() =>
  //           editor?.chain().focus().toggleHeading({ level: 2 }).run()
  //         }
  //         className={`p-1 rounded ${
  //           editor?.isActive("heading", { level: 2 })
  //             ? "bg-gray-200"
  //             : "hover:bg-gray-100"
  //         }`}
  //         title="Heading 2"
  //       >
  //         <span className="font-bold">H2</span>
  //       </button>

  //       <button
  //         onClick={() =>
  //           editor?.chain().focus().toggleHeading({ level: 3 }).run()
  //         }
  //         className={`p-1 rounded ${
  //           editor?.isActive("heading", { level: 3 })
  //             ? "bg-gray-200"
  //             : "hover:bg-gray-100"
  //         }`}
  //         title="Heading 3"
  //       >
  //         <span className="font-bold">H3</span>
  //       </button>

  //       <div className="h-6 border-l border-gray-300 mx-2"></div>

  //       <button
  //         onClick={() => editor?.chain().focus().toggleBulletList().run()}
  //         className={`p-1 rounded ${
  //           editor?.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-100"
  //         }`}
  //         title="Bullet List"
  //       >
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           viewBox="0 0 24 24"
  //           width="24"
  //           height="24"
  //           className="w-5 h-5"
  //         >
  //           <path fill="none" d="M0 0h24v24H0z" />
  //           <path d="M8 4h13v2H8V4zm-5-.5h3v3H3v-3zm0 7h3v3H3v-3zm0 7h3v3H3v-3zM8 11h13v2H8v-2zm0 7h13v2H8v-2z" />
  //         </svg>
  //       </button>

  //       <button
  //         onClick={() => editor?.chain().focus().toggleOrderedList().run()}
  //         className={`p-1 rounded ${
  //           editor?.isActive("orderedList") ? "bg-gray-200" : "hover:bg-gray-100"
  //         }`}
  //         title="Numbered List"
  //       >
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           viewBox="0 0 24 24"
  //           width="24"
  //           height="24"
  //           className="w-5 h-5"
  //         >
  //           <path fill="none" d="M0 0h24v24H0z" />
  //           <path d="M8 4h13v2H8V4zM5 3v3h1v1H3V6h1V4H3V3h2zm-2 7h3.5v1H3v-1zm2 3v3h1v1H3v-1h1v-1H3v-1h2zm-2 7h3.5v1H3v-1zM8 11h13v2H8v-2zm0 7h13v2H8v-2z" />
  //         </svg>
  //       </button>

  //       <button
  //         onClick={() => editor?.chain().focus().toggleBlockquote().run()}
  //         className={`p-1 rounded ${
  //           editor?.isActive("blockquote") ? "bg-gray-200" : "hover:bg-gray-100"
  //         }`}
  //         title="Blockquote"
  //       >
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           viewBox="0 0 24 24"
  //           width="24"
  //           height="24"
  //           className="w-5 h-5"
  //         >
  //           <path fill="none" d="M0 0h24v24H0z" />
  //           <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
  //         </svg>
  //       </button>

  //       <div className="h-6 border-l border-gray-300 mx-2"></div>

  //       <button
  //         onClick={() => editor?.chain().focus().undo().run()}
  //         disabled={!editor?.can().chain().focus().undo().run()}
  //         className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
  //         title="Undo"
  //       >
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           viewBox="0 0 24 24"
  //           width="24"
  //           height="24"
  //           className="w-5 h-5"
  //         >
  //           <path fill="none" d="M0 0h24v24H0z" />
  //           <path d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z" />
  //         </svg>
  //       </button>

  //       <button
  //         onClick={() => editor?.chain().focus().redo().run()}
  //         disabled={!editor?.can().chain().focus().redo().run()}
  //         className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
  //         title="Redo"
  //       >
  //         <svg
  //           xmlns="http://www.w3.org/2000/svg"
  //           viewBox="0 0 24 24"
  //           width="24"
  //           height="24"
  //           className="w-5 h-5"
  //         >
  //           <path fill="none" d="M0 0h24v24H0z" />
  //           <path d="M18.172 7H11a6 6 0 1 0 0 12h9v2h-9a8 8 0 1 1 0-16h7.172l-2.536-2.536L17.05 1.05 22 6l-4.95 4.95-1.414-1.414L18.172 7z" />
  //         </svg>
  //       </button>
  //     </div>
  //   );

  return (
    <div className="flex flex-col h-full bg-white rounded">
      <EditorContent editor={editor} />
    </div>
  );
}

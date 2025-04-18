"use client";
// app/[userid]/[caseid]/documents/[docid]/page.tsx

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase, getDocumentFile } from "@/utils/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentData {
  id: string;
  name: string;
  file_path?: string;
  file_type?: string;
  public_url?: string;
}

export default function DocumentViewerPage() {
  const params = useParams();
  const userId = params.userid as string;
  const caseId = params.caseid as string;
  const docId = params.docid as string;

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch document metadata
  const { data: document, isLoading: isLoadingMeta } = useQuery<DocumentData>({
    queryKey: ["document", docId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", docId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Load the PDF file when document metadata is available
  useEffect(() => {
    if (!document?.file_path) return;

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the file from Supabase storage
        const fileData = await getDocumentFile(document.file_path);

        // Convert the blob to an ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer();

        // Convert ArrayBuffer to Uint8Array which react-pdf can use
        const uint8Array = new Uint8Array(arrayBuffer);

        setPdfData(uint8Array);
      } catch (err) {
        console.error("Error loading document:", err);
        setError("Failed to load document. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [document]);

  // Handle PDF load success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Navigation controls
  const goToPrevPage = () => {
    setPageNumber((prev) => (prev - 1 > 0 ? prev - 1 : prev));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => (prev + 1 <= (numPages || 1) ? prev + 1 : prev));
  };

  // Zoom controls
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1);

  // Render loading state
  if (isLoadingMeta || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !document) {
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
                Error loading document
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || "Document not found"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if the document is a PDF
  const isPdf = document.file_type?.includes("pdf");

  // If not a PDF, show a message with download link
  if (!isPdf || !pdfData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {document.name}
          </h3>
          <p className="text-gray-600 mb-4">
            {isPdf
              ? "Unable to preview this PDF file."
              : "This file type cannot be previewed."}
          </p>
          <a
            href={document.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Download File
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Navigation toolbar */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-gray-700 truncate max-w-xs md:max-w-md">
            {document.name}
          </h3>
          <div className="text-sm text-gray-500">
            {pageNumber} of {numPages}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
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
          <a
            href={document.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
          >
            Download
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-200 flex justify-center">
        <div className="p-4">
          <Document
            file={{ data: pdfData }} // ✅ wrap it!
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            }
            error={
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-500">
                  Error loading PDF. The file might be corrupted.
                </p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

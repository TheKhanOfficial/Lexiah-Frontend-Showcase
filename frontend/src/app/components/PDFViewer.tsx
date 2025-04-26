"use client";
// app/components/PDFViewer.tsx

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, getDocumentFile } from "@/utils/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { InputBar } from "@/app/components/InputBar";
import { ToggleHideShow } from "@/app/components/ToggleHideShow";
import { getAIResponse } from "@/utils/api";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentData {
  id: string;
  name: string;
  file_path?: string;
  file_type?: string;
  public_url?: string;
  summary?: string;
}

interface PDFViewerProps {
  userId: string;
  caseId: string;
  docId: string;
  onClose: () => void;
}

export default function PDFViewer({
  userId,
  caseId,
  docId,
  onClose,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [inputValue, setInputValue] = useState("1");
  const [scale, setScale] = useState<number>(1.0);
  const pdfDataRef = useRef<Uint8Array | null>(null); // for summary generation
  const pdfUrlRef = useRef<string | null>(null); // for PDF rendering
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAISummary, setShowAISummary] = useState<boolean>(true);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastManualJump = useRef(false);

  // Add state for PDF text and Claude summary
  const [pdfText, setPdfText] = useState<string>("");
  const [docSummary, setDocSummary] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showInstructionsModal, setShowInstructionsModal] =
    useState<boolean>(false);
  const [summaryInstructions, setSummaryInstructions] = useState<string>("");

  const queryClient = useQueryClient();

  // Refs for each page to enable scrolling
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // Mutation to save summary back to Supabase
  const saveSummaryMutation = useMutation({
    mutationFn: async (summary: string) => {
      const { data, error } = await supabase
        .from("documents")
        .update({ summary })
        .eq("id", docId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", docId] });
    },
  });

  // Set initial summary from document data
  useEffect(() => {
    if (document?.summary) {
      setDocSummary(document.summary);
    }
  }, [document]);

  // Load the PDF file when document metadata is available
  useEffect(() => {
    if (!document?.file_path) return;

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const fileData = await getDocumentFile(document.file_path);
        if (!fileData) {
          throw new Error("No file data received from Supabase");
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        pdfDataRef.current = uint8Array; // for summary generation
        const blob = new Blob([uint8Array], { type: "application/pdf" });
        pdfUrlRef.current = URL.createObjectURL(blob); // for viewer
      } catch (err) {
        console.error("Error loading document:", err);
        setError("Failed to load document. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [document]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  // Function to generate summary
  const generateSummary = async (customInstructions: string = "") => {
    if (!pdfDataRef.current || !document) return;

    try {
      setIsSummarizing(true);
      setDocSummary("Analyzing document...");

      // Load PDF.js to extract text
      const pdf = await pdfjs.getDocument({ data: pdfDataRef.current! })
        .promise;

      let fullText = "";

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + " ";
      }

      setPdfText(fullText);

      // Split text into chunks of approximately 180k characters
      const chunkSize = 180000;
      const textChunks = [];
      for (let i = 0; i < fullText.length; i += chunkSize) {
        textChunks.push(fullText.slice(i, i + chunkSize));
      }

      console.log(
        `Extracted ${fullText.length} characters, split into ${textChunks.length} chunks`
      );

      // Process each chunk sequentially, building on previous summaries
      let combinedSummary = "";

      for (let i = 0; i < textChunks.length; i++) {
        const isFirstChunk = i === 0;
        const isLastChunk = i === textChunks.length - 1;

        let prompt = "";

        if (isFirstChunk) {
          prompt = `Here is the beginning of a document titled "${
            document.name
          }". ${
            customInstructions
              ? `I have specific instructions for the summary: ${customInstructions}. `
              : ""
          }Please provide a detailed summary of its key points:\n\n${
            textChunks[i]
          }`;
        } else if (isLastChunk) {
          prompt = `This is the final part of the document. Based on this and the previous sections (which you summarized as: "${combinedSummary}"), ${
            customInstructions
              ? `following these instructions: ${customInstructions}, `
              : ""
          }please provide a complete, cohesive summary of the entire document:\n\n${
            textChunks[i]
          }`;
        } else {
          prompt = `Continuing from the previous section (which you summarized as: "${combinedSummary}"), here is the next part of the document. ${
            customInstructions
              ? `Following these instructions: ${customInstructions}, `
              : ""
          }Please update your summary with any new key information:\n\n${
            textChunks[i]
          }`;
        }

        // Update summary status
        setDocSummary(
          `Analyzing document... (part ${i + 1} of ${textChunks.length})`
        );

        // Call Claude API to summarize this chunk
        const chunkSummary = await getAIResponse([
          { role: "user", content: prompt },
        ]);

        // For first chunk, use its summary as is; for later chunks, build on previous summary
        if (isFirstChunk) {
          combinedSummary = chunkSummary;
        } else {
          // Use the AI's latest output as the combined summary
          combinedSummary = chunkSummary;
        }
      }

      // Set the final summary
      setDocSummary(combinedSummary);

      // Save the summary to Supabase
      await saveSummaryMutation.mutateAsync(combinedSummary);
    } catch (err) {
      console.error("Error summarizing document:", err);
      setDocSummary("Error creating summary. Please try again later.");
    } finally {
      setIsSummarizing(false);
      setShowInstructionsModal(false);
      setSummaryInstructions("");
    }
  };

  // Handler for "Generate Summary" button
  const handleGenerateSummary = () => {
    if (document?.summary) {
      setShowConfirmDialog(true);
    } else {
      setShowInstructionsModal(true);
    }
  };

  // Handler for submitting custom instructions
  const handleSubmitInstructions = () => {
    generateSummary(summaryInstructions);
    setShowInstructionsModal(false);
  };

  // Track which page is most visible while scrolling
  useEffect(() => {
    if (!numPages) return;

    if (observerRef.current) observerRef.current.disconnect();

    const intersectionRatios = new Map<number, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageIdx = parseInt(
            entry.target.getAttribute("data-page-idx") || "0",
            10
          );
          intersectionRatios.set(pageIdx, entry.intersectionRatio);
        });

        let maxRatio = 0;
        let visiblePage = pageNumber;

        intersectionRatios.forEach((ratio, idx) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            visiblePage = idx + 1;
          }
        });

        // Update page number ONLY IF NOT manually jumped
        if (!lastManualJump.current && visiblePage !== pageNumber) {
          setPageNumber(visiblePage);
          setInputValue(visiblePage.toString());
        }
      },
      {
        root: viewerContainerRef.current,
        threshold: [0.3, 0.5, 0.7],
      }
    );

    pageRefs.current.forEach((ref, idx) => {
      if (ref) {
        ref.setAttribute("data-page-idx", idx.toString());
        observerRef.current?.observe(ref);
      }
    });

    return () => observerRef.current?.disconnect();
  }, [numPages, pageNumber]);

  // Handle PDF load success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    if (document) {
      console.log("PDF file type from Supabase:", document.file_type);
      console.log("Public URL:", document.public_url);
    }

    setNumPages(numPages);
    setPageNumber(1);
    setInputValue("1");

    // Initialize refs array
    pageRefs.current = Array(numPages).fill(null);
  }

  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container || !numPages) return;

    let timeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeout);

      let closestPage = 1;
      let closestOffset = Infinity;

      pageRefs.current.forEach((ref, index) => {
        if (ref) {
          const offset = Math.abs(
            ref.getBoundingClientRect().top -
              container.getBoundingClientRect().top
          );
          if (offset < closestOffset) {
            closestOffset = offset;
            closestPage = index + 1;
          }
        }
      });

      if (closestPage !== pageNumber) {
        setPageNumber(closestPage);
        setInputValue(closestPage.toString());
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [numPages, pageNumber]);

  // Navigation controls
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      setInputValue(newPage.toString());
    }
  };

  const goToNextPage = () => {
    if (pageNumber < (numPages || 1)) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      setInputValue(newPage.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const page = parseInt(val);
    if (!isNaN(page) && page >= 1 && page <= (numPages || 1)) {
      const el = pageRefs.current[page - 1];
      if (el && viewerContainerRef.current) {
        lastManualJump.current = true;

        // Instantly jump with no animation
        viewerContainerRef.current.scrollTop = el.offsetTop;

        setPageNumber(page); // make sure number updates
        setTimeout(() => {
          lastManualJump.current = false;
        }, 300); // let it stabilize
      }
    }
  };

  const handleInputCommit = () => {
    const newPage = parseInt(inputValue);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= (numPages || 1)) {
      setPageNumber(newPage);
    } else {
      setInputValue(pageNumber.toString()); // reset to valid
    }
  };

  // Handle chat input submission
  const handleInputSubmit = (text: string, isDocumentSearch: boolean) => {
    // No need to navigate anymore - we'll handle via parent component
    // For now, just log the input
    console.log("PDF Viewer input:", text, isDocumentSearch);
  };

  // Zoom controls
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1);

  // Toggle AI Summary panel
  const toggleAISummary = () => {
    setShowAISummary(!showAISummary);
  };

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
  if (!isPdf || !pdfDataRef.current) {
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

          <button
            onClick={onClose}
            className="ml-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Split view container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* PDF Viewer with auto-sizing */}
        <div
          className={`flex flex-col min-w-0 overflow-hidden ${
            showAISummary ? "" : "flex-1"
          }`}
        >
          {/* Close button - like NoteViewer */}
          <div className="absolute top-8 right-4 z-10">
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-md"
              aria-label="Close document"
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

          {/* PDF Navigation toolbar */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-medium text-gray-700 truncate max-w-xs md:max-w-md">
                {document.name}
              </h3>
              <div className="text-sm text-gray-500">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputCommit}
                  onKeyPress={(e) => e.key === "Enter" && handleInputCommit()}
                  className="w-16 border rounded px-2 py-1 text-sm"
                />
                <span className="ml-1">of {numPages}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
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

          <div
            ref={viewerContainerRef}
            className="h-full overflow-auto bg-gray-200 flex justify-center"
          >
            <div className="p-4">
              {/* Don't even try rendering Document if pdfData is missing */}
              {!pdfDataRef.current ? (
                <div className="text-gray-500 text-sm">Loading PDF file...</div>
              ) : (
                <Document
                  file={pdfUrlRef.current}
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
                  {Array.from(new Array(numPages), (_, index) => (
                    <div
                      key={`page_container_${index + 1}`}
                      ref={(el) => (pageRefs.current[index] = el)}
                    >
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-lg mb-4"
                      />
                    </div>
                  ))}
                </Document>
              )}
            </div>
          </div>
        </div>

        {/* Toggle button and AI Summary */}
        {showAISummary ? (
          <div className="flex flex-col flex-1 h-full">
            {/* Toggle button positioned higher up */}
            <div className="absolute right-0 top-24 z-10">
              <ToggleHideShow
                isVisible={showAISummary}
                onToggle={toggleAISummary}
                hiddenDirection="left"
                visibleDirection="right"
              />
            </div>

            {/* AI Summary content */}
            <div className="h-full border-l border-gray-300 overflow-auto bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Document Summary
                  </h3>
                  {isSummarizing && (
                    <div className="ml-3 animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                  )}
                </div>

                {!isSummarizing && !showConfirmDialog && (
                  <button
                    onClick={handleGenerateSummary}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                  >
                    Generate Summary
                  </button>
                )}
              </div>

              {showConfirmDialog ? (
                <div className="bg-yellow-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-yellow-800 mb-3">
                    A summary already exists. Do you want to replace it with a
                    new one?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setShowInstructionsModal(true);
                      }}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
                    >
                      Yes, replace
                    </button>
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {isSummarizing ? (
                <p className="text-gray-600">{docSummary}</p>
              ) : (
                <div className="prose prose-sm">
                  {docSummary ? (
                    <div className="whitespace-pre-wrap text-gray-700">
                      {docSummary}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Click "Generate Summary" to create a summary of this
                      document.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute right-0 top-24 z-10">
            <ToggleHideShow
              isVisible={showAISummary}
              onToggle={toggleAISummary}
              hiddenDirection="left"
              visibleDirection="right"
            />
          </div>
        )}
      </div>

      {/* Modal for instructions */}
      {showInstructionsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Summary Instructions
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter any special instructions for the summary (optional):
              </label>
              <textarea
                value={summaryInstructions}
                onChange={(e) => setSummaryInstructions(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="E.g., Focus on legal implications, highlight key dates, etc."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowInstructionsModal(false);
                  setSummaryInstructions("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInstructions}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
              >
                Generate Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

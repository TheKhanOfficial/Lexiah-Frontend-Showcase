"use client";
// app/[userid]/[caseid]/documents/page.tsx

import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";
import { InputBar } from "@/app/components/InputBar";
import { useRouter, useParams } from "next/navigation";

export default function DocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userid as string;
  const caseId = params.caseid as string;

  const tabs = [
    { id: "documents", label: "Documents", path: "documents" },
    { id: "notes", label: "Notes", path: "notes" },
    { id: "chat", label: "Chat", path: "chat" },
  ];

  const handleInputSubmit = async (text: string, isDocumentSearch: boolean) => {
    // Encode the text to be safe in a URL
    const encodedText = encodeURIComponent(text);

    // Navigate to chat with the text as a search parameter
    router.push(`/${userId}/${caseId}/chat?message=${encodedText}`);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        <div className="flex-1 overflow-auto p-4">
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-medium mb-2">Documents</h2>
            <p className="text-gray-500">
              This is where your document list will appear. You can upload and
              manage documents for this case here.
            </p>
          </div>
        </div>
        <InputBar onSubmit={handleInputSubmit} />
      </div>
    </MainLayout>
  );
}

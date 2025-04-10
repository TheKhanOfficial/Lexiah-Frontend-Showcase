// app/[userid]/[caseid]/notes/page.tsx
"use client";

import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";
import { InputBar } from "@/app/components/InputBar";
import { useRouter, useParams } from "next/navigation";

export default function NotesPage() {
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
    router.push(`/${userId}/${caseId}/chat`);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        {/* Workspace Content */}
        <div className="flex-1 p-4">
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-medium mb-2">Notes</h2>
            <p className="text-gray-500">
              This is where your note list will appear. You can create and
              manage notes for this case here.
            </p>
          </div>
        </div>
        <InputBar onSubmit={handleInputSubmit} />
      </div>
    </MainLayout>
  );
}

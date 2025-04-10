// app/[userid]/[caseid]/documents/page.tsx
"use client";

import { MainLayout } from "@/app/components/MainLayout";
import { WorkspaceTabs } from "@/app/components/WorkspaceTabs";

export default function DocumentsPage() {
  const tabs = [
    { id: "documents", label: "Documents", path: "documents" },
    { id: "notes", label: "Notes", path: "notes" },
    { id: "chat", label: "Chat", path: "chat" },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <WorkspaceTabs tabs={tabs} />

        {/* Workspace Content */}
        <div className="flex-1 p-4">
          <div className="p-4 border rounded-md">
            <h2 className="text-lg font-medium mb-2">Documents</h2>
            <p className="text-gray-500">
              This is where your document list will appear. You can upload and
              manage documents for this case here.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

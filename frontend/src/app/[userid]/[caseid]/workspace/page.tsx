"use client";
// app/[userid]/[caseid]/workspace/page.tsx

import { useState, useEffect } from "react";
import { MainLayout } from "@/app/components/MainLayout";
import Workspace from "@/app/components/Workspace";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";

interface Case {
  id: string;
  name: string;
  created_at: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const userId = params.userid as string;
  const caseId = params.caseid as string;

  // State for splitscreen functionality
  const [splitscreenCount, setSplitscreenCount] = useState<number>(1);
  const [workspaceStates, setWorkspaceStates] = useState<
    {
      id: string;
      activeTab: string;
    }[]
  >([{ id: "workspace-1", activeTab: "documents" }]);

  // Fetch case data for the header
  const { data: caseData } = useQuery<Case>({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Update workspaceStates when splitscreenCount changes
  useEffect(() => {
    // Add workspaces if count increased
    if (workspaceStates.length < splitscreenCount) {
      const newWorkspaces = [...workspaceStates];

      for (let i = workspaceStates.length; i < splitscreenCount; i++) {
        newWorkspaces.push({
          id: `workspace-${i + 1}`,
          activeTab: "documents",
        });
      }

      setWorkspaceStates(newWorkspaces);
    }
    // Remove workspaces if count decreased
    else if (workspaceStates.length > splitscreenCount) {
      setWorkspaceStates(workspaceStates.slice(0, splitscreenCount));
    }
  }, [splitscreenCount]);

  // Render workspaces based on splitscreen count
  const renderWorkspaces = () => {
    // Calculate width class based on count
    const widthClass =
      splitscreenCount === 1
        ? "w-full"
        : splitscreenCount === 2
        ? "w-1/2"
        : "w-1/3";

    return (
      <div className="flex flex-1 overflow-hidden h-full">
        {workspaceStates.map((workspace, index) => (
          <div
            key={workspace.id}
            className={`${widthClass} h-full ${
              index > 0 ? "border-l border-gray-300" : ""
            }`}
          >
            <Workspace
              userId={userId}
              caseId={caseId}
              initialActiveTab={workspace.activeTab}
              className="h-full"
              instanceId={workspace.id}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <MainLayout
      splitscreenCount={splitscreenCount}
      onSplitscreenChange={setSplitscreenCount}
    >
      <div className="flex flex-col h-full">{renderWorkspaces()}</div>
    </MainLayout>
  );
}

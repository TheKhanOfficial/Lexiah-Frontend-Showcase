// components/WorkspaceTabs.tsx
"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

interface Tab {
  id: string;
  label: string;
  path: string;
}

interface WorkspaceTabsProps {
  tabs: Tab[];
}

export function WorkspaceTabs({ tabs }: WorkspaceTabsProps) {
  const params = useParams();
  const pathname = usePathname();
  const userId = params.userid as string;
  const caseId = params.caseid as string;

  // Determine active tab from current path
  const getActiveTab = () => {
    for (const tab of tabs) {
      if (pathname.includes(`/${userId}/${caseId}/${tab.path}`)) {
        return tab.id;
      }
    }
    return tabs[0]?.id; // Default to first tab
  };

  const activeTab = getActiveTab();

  return (
    <div className="border-b border-gray-200 w-full">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/${userId}/${caseId}/${tab.path}`}
            className="flex-1 text-center"
          >
            <div
              className={`py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-gray-800 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

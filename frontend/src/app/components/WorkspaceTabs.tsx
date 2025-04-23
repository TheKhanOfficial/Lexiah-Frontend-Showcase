// components/WorkspaceTabs.tsx
"use client";

interface Tab {
  id: string;
  label: string;
}

interface WorkspaceTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function WorkspaceTabs({
  tabs,
  activeTab,
  onTabChange,
}: WorkspaceTabsProps) {
  return (
    <div className="border-b border-gray-200 w-full">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
          </button>
        ))}
      </div>
    </div>
  );
}

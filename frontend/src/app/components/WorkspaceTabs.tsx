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
      <div className="flex w-full gap-px bg-[#d1d5db]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 text-center"
          >
            <div
              className={`tab py-4 px-1 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#111827] text-[#F9FAFB] bg-[#111827] font-semibold"
                  : "border-transparent hover:text-[#F9FAFB] text-[#] hover:bg-[#111827]"
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

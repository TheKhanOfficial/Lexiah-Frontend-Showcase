"use client";
//UIContext.tsx

import { createContext, useContext, useState, ReactNode } from "react";

type UIContextType = {
  sidebarGlitchFix: boolean;
  setSidebarGlitchFix: (val: boolean) => void;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarGlitchFix, setSidebarGlitchFix] = useState(true);

  return (
    <UIContext.Provider value={{ sidebarGlitchFix, setSidebarGlitchFix }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within a UIProvider");
  return context;
}

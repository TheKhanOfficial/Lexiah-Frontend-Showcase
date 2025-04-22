// utils/uiState.ts
import { create } from "zustand";

interface UIState {
  isSidebarVisible: boolean;
  isHeaderVisible: boolean;
  setSidebarVisible: (val: boolean) => void;
  setHeaderVisible: (val: boolean) => void;
}

// Load from localStorage or default to true
const loadState = (key: string, fallback: boolean) => {
  if (typeof window === "undefined") return fallback;
  const val = localStorage.getItem(key);
  return val !== null ? val === "true" : fallback;
};

export const useUIState = create<UIState>((set) => ({
  isSidebarVisible: loadState("sidebarVisible", true),
  isHeaderVisible: loadState("headerVisible", true),
  setSidebarVisible: (val) => {
    localStorage.setItem("sidebarVisible", val.toString());
    set({ isSidebarVisible: val });
  },
  setHeaderVisible: (val) => {
    localStorage.setItem("headerVisible", val.toString());
    set({ isHeaderVisible: val });
  },
}));

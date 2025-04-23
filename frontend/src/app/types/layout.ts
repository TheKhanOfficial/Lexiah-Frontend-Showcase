// types/layout.ts

export interface MainLayoutProps {
  children: React.ReactNode;
  splitscreenCount?: number;
  onSplitscreenChange?: (value: number) => void;
}

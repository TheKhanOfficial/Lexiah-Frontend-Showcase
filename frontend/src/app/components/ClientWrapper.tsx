"use client";

import { ReactNode } from "react";
import ScrollAnimator from "./ScrollAnimator";

export default function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollAnimator />
      {children}
    </>
  );
}

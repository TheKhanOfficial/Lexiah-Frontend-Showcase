//frontend/src/app/lib/useAnonId.ts
"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export function useAnonId(): string | null {
  const [anonId, setAnonId] = useState<string | null>(null);

  useEffect(() => {
    let existing = localStorage.getItem("lexiah_anon_id");

    if (!existing) {
      const newId = uuidv4();
      localStorage.setItem("lexiah_anon_id", newId);
      existing = newId;

      // Register anon user in Supabase
      fetch("/api/create-anon-user", {
        method: "POST",
        body: JSON.stringify({ anonId: newId }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    setAnonId(existing);
  }, []);

  return anonId;
}

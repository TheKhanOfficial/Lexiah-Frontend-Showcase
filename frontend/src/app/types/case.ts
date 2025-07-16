// app/types/case.ts

export interface Case {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  folder_id?: string | null; // ✅ add this to match DB schema
}

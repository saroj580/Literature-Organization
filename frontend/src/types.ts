// types.ts — Shared TypeScript types

export interface DocumentMeta {
  title: string;
  type: 'code' | 'paper' | 'diagram' | 'note';
  content?: string;
  language?: string;
  author?: string;
  tags?: string[];      // free-form labels e.g. ["auth", "jwt"]
}

export interface Doc {
  id: number;
  data: DocumentMeta;
  created_at?: string;  // ISO datetime string from backend
}

export type SortOrder = 'newest' | 'oldest' | 'az' | 'za';

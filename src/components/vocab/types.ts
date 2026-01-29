export type VocabItemCreateActionState =
  | { status: "idle" }
  | { status: "success"; at: number }
  | { status: "error"; message: string; at: number };

export type VocabItemRow = {
  id: string;
  ja_surface: string;
  ja_reading_hira: string | null;
  ko_meaning: string | null;
  memo: string | null;
  is_active: boolean;
};

export type VocabListOption = {
  id: string;
  name: string;
};


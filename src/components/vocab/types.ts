export type VocabItemCreateActionState =
  | { status: "idle" }
  | { status: "success"; at: number }
  | { status: "error"; message: string; at: number };

export type VocabItemRow = {
  id: string;
  ja_surface: string;
  ja_reading_hira: string | null;
  /**
   * Optional pre-rendered ruby HTML for ja_surface.
   * Used to display furigana without storing ja_reading_hira.
   */
  ja_surface_ruby_html?: string | null;
  ko_meaning: string | null;
  memo: string | null;
  is_active: boolean;
};

export type VocabListOption = {
  id: string;
  name: string;
};


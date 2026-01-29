export type JlptLevel = "n1" | "n2" | "n3" | "n4" | "n5";

export const JLPT_LEVELS: Array<{ value: JlptLevel; label: string }> = [
  { value: "n1", label: "JLPT N1" },
  { value: "n2", label: "JLPT N2" },
  { value: "n3", label: "JLPT N3" },
  { value: "n4", label: "JLPT N4" },
  { value: "n5", label: "JLPT N5" },
];

export const DEFAULT_JLPT_LEVEL: JlptLevel = "n3";

export function jlptLabel(level: JlptLevel) {
  return JLPT_LEVELS.find((l) => l.value === level)?.label ?? "JLPT N3";
}


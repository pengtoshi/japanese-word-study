const KEY = "jh:lastVocabListId";

export function getLastUsedVocabListId(): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
  } catch {
    return null;
  }
}

export function setLastUsedVocabListId(listId: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, listId);
  } catch {
    // ignore
  }
}


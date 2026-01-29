"use client";

import { VocabItemAddSheet } from "@/components/vocab/VocabItemAddSheet";
import type { VocabItemCreateActionState } from "@/components/vocab/types";

export function PracticeAddVocabFab({
  createAction,
}: {
  createAction: (
    prevState: VocabItemCreateActionState,
    formData: FormData
  ) => Promise<VocabItemCreateActionState>;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30">
      <div className="mx-auto w-full max-w-xl px-4 flex justify-end">
        <VocabItemAddSheet mode="select" action={createAction} />
      </div>
    </div>
  );
}


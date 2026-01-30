"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { BottomSheetSelect } from "@/components/BottomSheetSelect";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { JlptPill } from "@/components/JlptPill";
import { PendingModal } from "@/components/PendingModal";

function PracticePendingModal() {
  const { pending } = useFormStatus();
  return (
    <PendingModal
      open={pending}
      srTitle="연습문제 생성 중"
      title="연습문제 생성 중"
      description="잠시만 기다려주세요…"
      footer="선택한 단어장으로 연습문제 10개를 만들고 있어요."
    />
  );
}

export function StartPracticeForm({
  lists,
  action,
  jlptLevel,
}: {
  lists: Array<{ id: string; name: string }>;
  action: (formData: FormData) => void | Promise<void>;
  jlptLevel: string;
}) {
  const [listId, setListId] = React.useState<string>("");

  return (
    <form action={action} className="mt-3 space-y-3">
      <BottomSheetSelect
        name="listId"
        value={listId}
        onValueChange={setListId}
        placeholder="단어장을 선택하세요"
        sheetTitle="단어장 선택"
        options={lists.map((l) => ({ value: l.id, label: l.name }))}
      />

      <div className="flex items-center justify-between gap-3">
        <JlptPill level={jlptLevel} />
        <FormSubmitButton
          type="submit"
          className="w-full max-w-[260px]"
          disabled={!listId}
          pendingText="생성 중"
        >
          문제 10개 생성하고 시작
        </FormSubmitButton>
      </div>

      <PracticePendingModal />
    </form>
  );
}


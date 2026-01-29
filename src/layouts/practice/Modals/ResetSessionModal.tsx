"use client";

import { ConfirmModalForm } from "@/components/ConfirmModalForm";
import { cn } from "@/lib/utils";

export function ResetSessionModal({
  resetAction,
}: {
  resetAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <ConfirmModalForm
      action={resetAction}
      triggerLabel="초기화"
      triggerVariant="destructive"
      triggerClassName={cn("h-8 px-3 text-xs font-semibold")}
      title="초기화할까요?"
      description={
        <>
          이 세션의 모든 정답/오답 기록이 삭제되고, 처음부터 다시 풀 수 있어요.
          <br />
          되돌릴 수 없어요.
        </>
      }
      confirmLabel="초기화"
      confirmVariant="default"
    />
  );
}


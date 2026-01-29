import { Card } from "@/components/ui/Card";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { JlptPill } from "@/components/JlptPill";

export function VocabQuickStartPanel({
  listId,
  jlptLevel,
  totalActiveCount,
  startPracticeAction,
}: {
  listId: string;
  jlptLevel: string;
  totalActiveCount: number;
  startPracticeAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">빠른 시작</div>
          <div className="mt-0.5 text-sm text-(--muted)">
            {totalActiveCount >= 10
              ? "연습 문제 10개를 만들고 시작해요."
              : "표현을 10개 이상 추가하면 연습을 시작할 수 있어요."}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <JlptPill level={jlptLevel} />
          <form action={startPracticeAction}>
            <FormSubmitButton
              type="submit"
              className="h-10"
              disabled={totalActiveCount < 10}
              pendingText="생성 중"
            >
              연습 시작
            </FormSubmitButton>
          </form>
        </div>
      </div>
    </Card>
  );
}


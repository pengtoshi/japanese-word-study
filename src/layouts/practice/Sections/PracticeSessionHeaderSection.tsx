import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { ResetSessionModal } from "@/layouts/practice/Modals/ResetSessionModal";
import {
  type PracticeQuickNavItem,
  PracticeSessionQuickNavSection,
} from "@/layouts/practice/Sections/PracticeSessionQuickNavSection";

export function PracticeSessionHeaderSection({
  sessionId,
  isWrongMode,
  wrongCount,
  total,
  answeredCount,
  quickNavItems,
  resetAction,
}: {
  sessionId: string;
  isWrongMode: boolean;
  wrongCount: number;
  total: number;
  answeredCount: number;
  quickNavItems: PracticeQuickNavItem[];
  resetAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <>
      {isWrongMode ? (
        wrongCount > 0 ? (
          <Alert tone="info">
            오답 복습 모드(오답만): {wrongCount}문제
            <div className="mt-2">
              <Link
                href={`/app/practice/${sessionId}/summary`}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                요약으로 돌아가기
              </Link>
            </div>
          </Alert>
        ) : (
          <Alert tone="info">
            오답이 없어요.{" "}
            <Link
              href={`/app/practice/${sessionId}/summary`}
              className="font-medium underline-offset-4 hover:underline"
            >
              요약 보기
            </Link>
          </Alert>
        )
      ) : null}

      <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div
          className="h-full bg-(--accent)"
          style={{
            width: `${total ? Math.round((answeredCount / total) * 100) : 0}%`,
          }}
        />
      </div>

      <PracticeSessionQuickNavSection
        sessionId={sessionId}
        answeredCount={answeredCount}
        total={total}
        isWrongMode={isWrongMode}
        items={quickNavItems}
        resetModal={<ResetSessionModal resetAction={resetAction} />}
      />
    </>
  );
}


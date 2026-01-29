import { Alert } from "@/components/ui/Alert";
import { safeDecodeURIComponent } from "@/utils/format";

export function PracticeHomeAlertsSection({
  errorParam,
  listsErrorMessage,
  sessionsErrorMessage,
}: {
  errorParam?: string;
  listsErrorMessage?: string | null;
  sessionsErrorMessage?: string | null;
}) {
  return (
    <>
      {errorParam ? (
        <Alert tone="danger">{safeDecodeURIComponent(errorParam)}</Alert>
      ) : null}
      {listsErrorMessage ? (
        <Alert tone="danger">단어장 목록을 불러오지 못했어요: {listsErrorMessage}</Alert>
      ) : null}
      {sessionsErrorMessage ? (
        <Alert tone="danger">
          이전 연습 기록을 불러오지 못했어요: {sessionsErrorMessage}
        </Alert>
      ) : null}
    </>
  );
}


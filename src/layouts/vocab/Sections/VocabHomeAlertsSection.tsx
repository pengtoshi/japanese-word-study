import { Alert } from "@/components/ui/Alert";
import { safeDecodeURIComponent } from "@/utils/format";

export function VocabHomeAlertsSection({
  errorParam,
  listsErrorMessage,
}: {
  errorParam?: string;
  listsErrorMessage?: string | null;
}) {
  return (
    <>
      {errorParam ? (
        <Alert tone="danger">{safeDecodeURIComponent(errorParam)}</Alert>
      ) : null}
      {listsErrorMessage ? (
        <Alert tone="danger">목록을 불러오지 못했어요: {listsErrorMessage}</Alert>
      ) : null}
    </>
  );
}


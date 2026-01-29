import { Alert } from "@/components/ui/Alert";
import { safeDecodeURIComponent } from "@/utils/format";

export function VocabListDetailAlertsSection({
  errorParam,
  itemsErrorMessage,
}: {
  errorParam?: string;
  itemsErrorMessage?: string | null;
}) {
  return (
    <>
      {errorParam ? (
        <Alert tone="danger">{safeDecodeURIComponent(errorParam)}</Alert>
      ) : null}
      {itemsErrorMessage ? (
        <Alert tone="danger">항목을 불러오지 못했어요: {itemsErrorMessage}</Alert>
      ) : null}
    </>
  );
}


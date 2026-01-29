import { Alert } from "@/components/ui/Alert";

export function PracticeSummaryErrorSection({ message }: { message: string }) {
  return <Alert tone="danger">{message}</Alert>;
}


import { Card } from "@/components/ui/Card";

export function PracticeSessionPromptSection({ promptKo }: { promptKo: string }) {
  return (
    <Card>
      <div className="text-sm font-semibold text-zinc-900">한국어 문장</div>
      <div className="mt-2 whitespace-pre-wrap text-base leading-7">{promptKo}</div>
    </Card>
  );
}


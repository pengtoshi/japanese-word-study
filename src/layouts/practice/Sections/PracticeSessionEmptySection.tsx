import { Card } from "@/components/ui/Card";

export function PracticeSessionEmptySection() {
  return (
    <Card>
      <div className="text-sm text-zinc-600">
        아직 문제가 없어요. (세션 생성이 완료되었는지 확인해주세요)
      </div>
    </Card>
  );
}


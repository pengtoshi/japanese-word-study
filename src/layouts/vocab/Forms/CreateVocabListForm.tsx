import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function CreateVocabListForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <Input
        name="name"
        placeholder="예: N2 문법 / 일상 회화 / 회사 표현"
        maxLength={50}
        required
      />
      <Button type="submit">만들기</Button>
    </form>
  );
}


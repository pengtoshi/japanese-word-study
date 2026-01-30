import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { TopBarConfig } from "@/components/TopBarProvider";
import { VocabHomeAlertsSection } from "@/layouts/vocab/Sections/VocabHomeAlertsSection";
import { CreateVocabListForm } from "@/layouts/vocab/Forms/CreateVocabListForm";
import { CreateScenarioVocabListForm } from "@/layouts/vocab/Forms/CreateScenarioVocabListForm";
import {
  createVocabListAction,
  deleteVocabListsAction,
} from "@/layouts/vocab/actions";
import { VocabListsPanel } from "@/layouts/vocab/Panels/VocabListsPanel.elements";

export default async function VocabListsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: lists, error } = await supabase
    .from("vocab_lists")
    .select("id, name, kind, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <TopBarConfig title="단어장" backHref={null} />
      <VocabHomeAlertsSection
        errorParam={errorParam}
        listsErrorMessage={error?.message ?? null}
      />

      <Card className="mt-4">
        <h2 id="create" className="text-base font-semibold scroll-mt-24">
          새 단어장 만들기
        </h2>
        <CreateVocabListForm action={createVocabListAction} />
      </Card>

      <Card id="scenario-create" className="scroll-mt-24">
        <h2 className="text-base font-semibold">상황별 단어장 만들기</h2>
        <div className="mt-1 text-sm text-(--muted)">
          상황을 입력하면 연습문제를 먼저 만들고, 그 문제에 맞는 단어/표현을 자동으로
          추출해서 단어장을 완성해요.
        </div>
        <CreateScenarioVocabListForm />
      </Card>

      <VocabListsPanel
        lists={(lists ?? []).map((l) => ({
          id: String(l.id),
          name: String(l.name),
          kind: (l.kind ? String(l.kind) : null) as "manual" | "scenario" | null,
          created_at: String(l.created_at),
        }))}
        deleteManyAction={deleteVocabListsAction}
      />
    </div>
  );
}

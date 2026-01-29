import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TopBarConfig } from "@/components/TopBarProvider";
import { PracticeStartPanel } from "@/layouts/practice/Panels/PracticeStartPanel";
import { PracticeSessionsPanel } from "@/layouts/practice/Panels/PracticeSessionsPanel";
import { PracticeHomeAlertsSection } from "@/layouts/practice/Sections/PracticeHomeAlertsSection";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  // NOTE: 패널이 각각 fetch를 하지만, 에러 섹션을 위해 여기서도 최소한의 에러 여부만 확인
  const userId = userData.user.id;
  const { error: listsError } = await supabase
    .from("vocab_lists")
    .select("id", { head: true, count: "exact" });
  const { error: sessionsError } = await supabase
    .from("practice_sessions")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId);

  return (
    <div className="space-y-4">
      <TopBarConfig title="연습" backHref={null} />

      <PracticeHomeAlertsSection
        errorParam={errorParam}
        listsErrorMessage={listsError?.message ?? null}
        sessionsErrorMessage={sessionsError?.message ?? null}
      />

      <PracticeStartPanel />
      <PracticeSessionsPanel />
    </div>
  );
}

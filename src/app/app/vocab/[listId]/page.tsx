import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { TopBarConfig } from "@/components/TopBarProvider";
import type { VocabItemRow } from "@/components/vocab/types";
import { VocabItemAddSheet } from "@/components/vocab/VocabItemAddSheet";
import { VocabItemsPanel } from "@/layouts/vocab/Panels/VocabItemsPanel.elements";
import { VocabListDetailAlertsSection } from "@/layouts/vocab/Sections/VocabListDetailAlertsSection";
import { toRubyHtml } from "@/lib/kuroshiro-server";
import {
  createVocabItemAction,
  deleteVocabItemsAction,
} from "@/layouts/vocab/actions";
import { ChevronRightIcon } from "lucide-react";

type VocabListRow = {
  id: string;
  name: string;
  created_at: string;
  kind?: "manual" | "scenario" | null;
  scenario_prompt?: string | null;
};

export default async function VocabListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ error?: string; q?: string; createdSessionId?: string }>;
}) {
  const { listId } = await params;
  const { error: errorParam, q, createdSessionId } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");
  const userId = userData.user.id;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("jlpt_level")
    .eq("user_id", userId)
    .maybeSingle();
  void settings;

  const { data: list, error: listError } = await supabase
    .from("vocab_lists")
    .select("id, name, kind, scenario_prompt, created_at")
    .eq("id", listId)
    .maybeSingle();

  if (listError) {
    return (
      <div className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          단어장을 불러오지 못했어요: {listError.message}
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-dvh bg-background px-4 py-8 text-foreground">
        <div className="mx-auto w-full max-w-xl">
          <Card>
            <div className="font-semibold">단어장을 찾지 못했어요.</div>
            <div className="mt-1 text-sm text-(--muted)">
              링크가 올바른지 확인해주세요.
            </div>
            <div className="mt-4">
              <Link
                className="text-sm font-semibold underline-offset-4 hover:underline"
                href="/app/vocab"
              >
                단어장 목록으로
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const itemsQuery = supabase
    .from("vocab_items")
    .select(
      "id, ja_surface, ja_reading_hira, ko_meaning, memo, is_active, created_at"
    )
    .eq("list_id", listId)
    .order("created_at", { ascending: false });

  // total active count (practice gating + header badge)
  const { count: activeCount, error: activeCountError } = await supabase
    .from("vocab_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId)
    .eq("is_active", true);

  if (activeCountError) {
    redirect(
      `/app/vocab/${listId}?error=${encodeURIComponent(
        activeCountError.message ?? "표현 개수를 확인하지 못했어요."
      )}`
    );
  }

  // 간단 검색: 표기/뜻에 대해 q를 포함하는 항목만
  const { data: items, error: itemsError } = query
    ? await itemsQuery.or(
        `ja_surface.ilike.%${query}%,ko_meaning.ilike.%${query}%`
      )
    : await itemsQuery;

  const typedList = list as unknown as VocabListRow;
  const isScenarioList = String(typedList.kind ?? "") === "scenario";
  void typedList;

  const totalActiveCount = activeCount ?? 0;
  const itemRows: VocabItemRow[] = await Promise.all(
    (items ?? []).map(async (it) => {
      const jaSurface = String(it.ja_surface);
      return {
        id: String(it.id),
        ja_surface: jaSurface,
        // keep existing column for non-scenario lists; scenario lists should not rely on it
        ja_reading_hira: it.ja_reading_hira ? String(it.ja_reading_hira) : null,
        // Prefer ruby rendering everywhere (final goal: do not rely on ja_reading_hira)
        ja_surface_ruby_html: await toRubyHtml(jaSurface),
        ko_meaning: it.ko_meaning ? String(it.ko_meaning) : null,
        memo: it.memo ? String(it.memo) : null,
        is_active: Boolean(it.is_active),
      };
    })
  );

  let scenarioSessionId: string | null = createdSessionId ?? null;
  if (isScenarioList && !scenarioSessionId) {
    const { data: latestScenarioSession } = await supabase
      .from("practice_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("list_id", listId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    scenarioSessionId = latestScenarioSession?.id
      ? String(latestScenarioSession.id)
      : null;
  }

  return (
    <div className="space-y-4 pb-28">
      <TopBarConfig title={list.name} backHref="/app/vocab" />

      <div className="space-y-3">
        {/* 바로 연습 시작 (상황별 단어장 + 기존 세션 존재) */}
        {isScenarioList && scenarioSessionId ? (
          <Link
            href={`/app/practice/${encodeURIComponent(scenarioSessionId)}`}
            className="inline-flex h-14 w-full items-center justify-between rounded-2xl bg-(--accent) px-5 text-base font-semibold text-white shadow-(--shadow-card) hover:bg-rose-600"
          >
            바로 연습 시작
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <VocabListDetailAlertsSection
        errorParam={errorParam}
        itemsErrorMessage={itemsError?.message ?? null}
      />

      {/* 단어 리스트 + 검색 */}
      <Card>
        <VocabItemsPanel
          listId={listId}
          totalActiveCount={totalActiveCount}
          initialQuery={query}
          items={itemRows}
          emptyMessage={
            query
              ? "검색 결과가 없어요. 다른 키워드로 검색해보세요."
              : "아직 저장된 표현이 없어요. 표현을 추가해보세요."
          }
          deleteManyAction={deleteVocabItemsAction.bind(null, listId)}
        />
      </Card>

      {/* Floating: 표현 추가 */}
      <VocabItemAddSheet
        mode="fixed"
        fixedListId={listId}
        action={createVocabItemAction.bind(null, listId)}
        triggerClassName="fixed bottom-24 right-4 z-40"
        triggerLabel="표현 추가"
      />
    </div>
  );
}

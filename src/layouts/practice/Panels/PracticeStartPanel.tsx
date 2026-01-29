import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { StartPracticeForm } from "@/layouts/practice/Forms/StartPracticeForm";

const StartSchema = z.object({
  listId: z.string().uuid(),
});

async function startPracticeAction(formData: FormData) {
  "use server";

  const raw = { listId: String(formData.get("listId") ?? "") };
  const parsed = StartSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/app/practice?error=${encodeURIComponent("단어장을 선택해주세요.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("jlpt_level")
    .eq("user_id", user.id)
    .maybeSingle();
  const jlptLevel = (settings?.jlpt_level ?? "n3") as
    | "n1"
    | "n2"
    | "n3"
    | "n4"
    | "n5";

  const { count: itemCount, error: itemCountError } = await supabase
    .from("vocab_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", parsed.data.listId)
    .eq("is_active", true);

  if (itemCountError) {
    redirect(
      `/app/practice?error=${encodeURIComponent(
        itemCountError.message ?? "표현 개수를 확인하지 못했어요."
      )}`
    );
  }

  if ((itemCount ?? 0) < 10) {
    redirect(
      `/app/practice?error=${encodeURIComponent(
        "연습은 표현 10개 이상부터 가능해요."
      )}`
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      list_id: parsed.data.listId,
      problem_count: 10,
      jlpt_level: jlptLevel,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    redirect(
      `/app/practice?error=${encodeURIComponent(
        sessionError?.message ?? "세션을 만들지 못했어요."
      )}`
    );
  }

  const cookieStore = await cookies();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/practice/generate`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cookieStore.toString(),
      },
      body: JSON.stringify({ sessionId: session.id }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const msg = await res.text();
    redirect(`/app/practice?error=${encodeURIComponent(`문제 생성 실패: ${msg}`)}`);
  }

  revalidatePath(`/app/practice/${session.id}`);
  redirect(`/app/practice/${session.id}`);
}

export async function PracticeStartPanel() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const userId = userData.user.id;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("jlpt_level")
    .eq("user_id", userId)
    .maybeSingle();
  const jlptLevel = String(settings?.jlpt_level ?? "n3");

  const { data: lists, error } = await supabase
    .from("vocab_lists")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    // 상위에서 에러 섹션을 보여주므로 여기서는 빈 패널로 처리
    return null;
  }

  return (
    <Card>
      <h2 className="text-base font-semibold">새 연습 시작</h2>
      <StartPracticeForm
        lists={(lists ?? []).map((l) => ({ id: String(l.id), name: String(l.name) }))}
        action={startPracticeAction}
        jlptLevel={jlptLevel}
      />
    </Card>
  );
}


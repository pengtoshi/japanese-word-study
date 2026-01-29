import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VocabItemCreateActionState } from "@/components/vocab/types";

const CreateListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "단어장 이름을 입력해주세요.")
    .max(50, "최대 50자까지 입력할 수 있어요."),
});

export async function createVocabListAction(formData: FormData) {
  "use server";

  const raw = { name: String(formData.get("name") ?? "") };
  const parsed = CreateListSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/app/vocab?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요."
      )}`
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { error } = await supabase.from("vocab_lists").insert({
    user_id: user.id,
    name: parsed.data.name,
  });

  if (error) {
    redirect(`/app/vocab?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/vocab");
  redirect("/app/vocab");
}

/**
 * Delete multiple vocab lists.
 *
 * Cascade semantics:
 * - DB schema uses `on delete cascade`, so deleting the list row cascades to
 *   vocab_items, practice_sessions, practice_problems, practice_attempts.
 */
export async function deleteVocabListsAction(formData: FormData) {
  "use server";

  const ids = formData
    .getAll("listId")
    .map((v) => String(v))
    .filter(Boolean);

  if (ids.length === 0) {
    redirect("/app/vocab");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("vocab_lists")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/app/vocab?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/vocab");
  // per requirement: reset query after delete
  redirect("/app/vocab");
}

const CreateItemSchema = z.object({
  jaSurface: z
    .string()
    .trim()
    .min(1, "일본어 원문(표기)을 입력해주세요.")
    .max(200, "최대 200자까지 입력할 수 있어요."),
  jaReadingHira: z
    .string()
    .trim()
    .max(200, "최대 200자까지 입력할 수 있어요.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  koMeaning: z
    .string()
    .trim()
    .min(1, "뜻(한국어)을 입력해주세요.")
    .max(400, "최대 400자까지 입력할 수 있어요."),
  memo: z
    .string()
    .trim()
    .max(800, "최대 800자까지 입력할 수 있어요.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export async function createVocabItemAction(
  listId: string,
  _prevState: VocabItemCreateActionState,
  formData: FormData
): Promise<VocabItemCreateActionState> {
  "use server";

  const raw = {
    jaSurface: String(formData.get("jaSurface") ?? ""),
    jaReadingHira: String(formData.get("jaReadingHira") ?? ""),
    koMeaning: String(formData.get("koMeaning") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  };

  const parsed = CreateItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요.",
      at: Date.now(),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { count, error: countError } = await supabase
    .from("vocab_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId)
    .eq("user_id", user.id);

  if (countError) {
    return { status: "error", message: countError.message, at: Date.now() };
  }
  if ((count ?? 0) >= 100) {
    return {
      status: "error",
      message: "단어/표현은 단어장당 최대 100개까지 저장할 수 있어요.",
      at: Date.now(),
    };
  }

  const { error } = await supabase.from("vocab_items").insert({
    user_id: user.id,
    list_id: listId,
    ja_surface: parsed.data.jaSurface,
    ja_reading_hira: parsed.data.jaReadingHira ?? null,
    ko_meaning: parsed.data.koMeaning,
    memo: parsed.data.memo ?? null,
    is_active: true,
  });

  if (error) {
    return { status: "error", message: error.message, at: Date.now() };
  }

  revalidatePath(`/app/vocab/${listId}`);
  return { status: "success", at: Date.now() };
}

export async function createVocabItemToSelectedListAction(
  _prevState: VocabItemCreateActionState,
  formData: FormData
): Promise<VocabItemCreateActionState> {
  "use server";

  const listId = String(formData.get("listId") ?? "");
  if (!listId) {
    return { status: "error", message: "단어장을 선택해주세요.", at: Date.now() };
  }
  if (!z.string().uuid().safeParse(listId).success) {
    return { status: "error", message: "단어장을 선택해주세요.", at: Date.now() };
  }

  // Reuse existing item action by calling the core logic with listId.
  // Note: this keeps validation/limits consistent.
  return await createVocabItemAction(listId, { status: "idle" }, formData);
}

export async function deleteVocabItemsAction(listId: string, formData: FormData) {
  "use server";

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const ids = formData
    .getAll("itemId")
    .map((v) => String(v))
    .filter(Boolean);

  if (ids.length === 0) {
    redirect(`/app/vocab/${listId}`);
  }

  const returnTo = String(formData.get("returnTo") ?? "");

  const { error } = await supabase
    .from("vocab_items")
    .delete()
    .in("id", ids)
    .eq("list_id", listId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/app/vocab/${listId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/app/vocab/${listId}`);
  redirect(returnTo || `/app/vocab/${listId}`);
}

export async function startPracticeFromListAction(listId: string) {
  "use server";

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
    .eq("list_id", listId)
    .eq("is_active", true)
    .eq("user_id", user.id);

  if (itemCountError) {
    redirect(
      `/app/vocab/${listId}?error=${encodeURIComponent(
        itemCountError.message ?? "표현 개수를 확인하지 못했어요."
      )}`
    );
  }

  if ((itemCount ?? 0) < 10) {
    redirect(
      `/app/vocab/${listId}?error=${encodeURIComponent(
        "연습은 표현 10개 이상부터 가능해요."
      )}`
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      list_id: listId,
      problem_count: 10,
      jlpt_level: jlptLevel,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    redirect(
      `/app/vocab/${listId}?error=${encodeURIComponent(
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
    redirect(
      `/app/vocab/${listId}?error=${encodeURIComponent(`문제 생성 실패: ${msg}`)}`
    );
  }

  revalidatePath(`/app/practice/${session.id}`);
  redirect(`/app/practice/${session.id}`);
}


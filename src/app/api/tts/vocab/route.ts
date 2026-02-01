import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai";
import { getOpenAiModels } from "@/lib/openai-models";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const itemId = url.searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json(
      { error: "Missing itemId" },
      { status: 400 }
    );
  }

  // 1) 먼저 Storage에 캐시된 음성이 있는지 확인
  const bucket = "tts";
  const objectPath = `${user.id}/vocab-items/${itemId}.mp3`;

  try {
    const existing = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 60);

    if (existing.data?.signedUrl) {
      return NextResponse.json({ url: existing.data.signedUrl });
    }
  } catch {
    // 객체가 없으면 에러가 날 수 있지만, 그 경우에는 계속 진행해서 새로 생성한다.
  }

  // 2) DB에서 일본어 텍스트(ja_surface)를 가져온다.
  const { data: item, error: itemError } = await supabase
    .from("vocab_items")
    .select("ja_surface")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (itemError) {
    return NextResponse.json(
      { error: `Failed to load vocab item: ${itemError.message}` },
      { status: 500 }
    );
  }

  if (!item?.ja_surface) {
    return NextResponse.json(
      { error: "Item has no ja_surface" },
      { status: 400 }
    );
  }

  const text = String(item.ja_surface);

  // 3) OpenAI TTS로 음성 생성
  const openai = getOpenAI();
  const { tts } = getOpenAiModels();

  let audioBuffer: ArrayBuffer;
  try {
    const response = await openai.audio.speech.create({
      model: tts.model,
      voice: "alloy",
      input: text,
    });

    // Node 환경에서 ArrayBuffer로 변환
    // openai.audio.speech.create는 Web Response 유사 객체를 반환하므로
    // arrayBuffer()를 한 번 더 호출해 바이트를 구한다.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioBuffer = await (response as any).arrayBuffer();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to generate speech audio";
    console.error("[tts] openai error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const audioBytes = Buffer.from(audioBuffer);

  // 4) Supabase Storage에 업로드 (캐시)
  const uploadResult = await supabase.storage.from(bucket).upload(objectPath, audioBytes, {
    contentType: "audio/mpeg",
    upsert: true,
  });

  if (uploadResult.error) {
    console.error("[tts] upload error:", uploadResult.error.message);
    return NextResponse.json(
      { error: `Failed to upload audio: ${uploadResult.error.message}` },
      { status: 500 }
    );
  }

  const signed = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60);

  if (!signed.data?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to create signed URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signed.data.signedUrl });
}


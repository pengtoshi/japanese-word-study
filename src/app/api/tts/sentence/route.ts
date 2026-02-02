import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai";
import { getOpenAiModels } from "@/lib/openai-models";
import { createHash } from "crypto";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : null;

  if (!text || text.length === 0) {
    return NextResponse.json({ error: "Missing or empty text" }, { status: 400 });
  }

  // Generate hash for the text to use as filename
  const textHash = createHash("sha256").update(text).digest("hex").slice(0, 16);
  const bucket = "tts";
  const objectPath = `${user.id}/sentences/${textHash}.mp3`;

  // 1) 먼저 Storage에 캐시된 음성이 있는지 확인
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

  // 2) OpenAI TTS로 음성 생성
  const openai = getOpenAI();
  const { tts } = getOpenAiModels();

  let audioBuffer: ArrayBuffer;
  try {
    const response = await openai.audio.speech.create({
      model: tts.model,
      voice: "alloy",
      input: text,
      response_format: "mp3",
    });

    // Node 환경에서 ArrayBuffer로 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioBuffer = await (response as any).arrayBuffer();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to generate speech audio";
    console.error("[tts] openai error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const audioBytes = Buffer.from(audioBuffer);

  // 3) Supabase Storage에 업로드 (캐시)
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

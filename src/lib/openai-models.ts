/**
 * OpenAI 모델 설정은 `.env.local`이 아니라 코드 상수로 고정합니다.
 * (요청: OPENAI_MODEL_* env 의존 제거)
 */
export const OPENAI_MODELS = {
  generate: { model: "gpt-5-mini", fallbackModel: "gpt-5-mini" },
  grade: {
    model: "gpt-5-nano",
    fallbackModel: "gpt-5-mini",
    fallbackOnNeedsFix: true,
  },
  autofill: { model: "gpt-5-nano", fallbackModel: "gpt-5-mini" },
  tts: { model: "gpt-4o-mini-tts", fallbackModel: "gpt-4o-mini-tts" },
} as const;

export function getOpenAiModels() {
  return OPENAI_MODELS;
}

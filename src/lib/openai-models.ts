function env(name: string) {
  return process.env[name]?.trim();
}

export function getOpenAiModels() {
  const generateModel = env("OPENAI_MODEL_GENERATE") || "gpt-5-mini";
  const generateFallbackModel =
    env("OPENAI_MODEL_GENERATE_FALLBACK") || "gpt-5-mini";

  const gradeModel = env("OPENAI_MODEL_GRADE") || "gpt-5-nano";
  const gradeFallbackModel = env("OPENAI_MODEL_GRADE_FALLBACK") || "gpt-5-mini";

  // Autofill (vocab auto-complete) defaults to grading model for low cost,
  // with optional override via env vars.
  const autofillModel = env("OPENAI_MODEL_AUTOFILL") || gradeModel;
  const autofillFallbackModel =
    env("OPENAI_MODEL_AUTOFILL_FALLBACK") || gradeFallbackModel;

  const gradeFallbackOnNeedsFix =
    (env("OPENAI_GRADE_FALLBACK_ON_NEEDS_FIX") || "true").toLowerCase() ===
    "true";

  return {
    generate: { model: generateModel, fallbackModel: generateFallbackModel },
    autofill: { model: autofillModel, fallbackModel: autofillFallbackModel },
    grade: {
      model: gradeModel,
      fallbackModel: gradeFallbackModel,
      fallbackOnNeedsFix: gradeFallbackOnNeedsFix,
    },
  };
}

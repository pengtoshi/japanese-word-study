import OpenAI from "openai";

function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing env: OPENAI_API_KEY");
  return key;
}

export function getOpenAI() {
  return new OpenAI({ apiKey: getOpenAiKey() });
}

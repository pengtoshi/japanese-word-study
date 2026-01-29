import { z } from "zod";
import { getOpenAI } from "@/lib/openai";

type Message = { role: "system" | "user" | "assistant"; content: string };

function shouldIncludeRaw() {
  return (process.env.OPENAI_DEBUG_RAW_RESPONSE || "").toLowerCase() === "true";
}

function clip(text: string, max = 2000) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…(truncated)";
}

function formatZodIssues(issues: z.ZodIssue[]) {
  return issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
    .join(" | ");
}

export async function chatJson<TSchema extends z.ZodTypeAny>({
  model,
  messages,
  schema,
}: {
  model: string;
  messages: Message[];
  schema: TSchema;
}): Promise<z.infer<TSchema>> {
  const openai = getOpenAI();
  const includeRaw = shouldIncludeRaw();

  const completion = await openai.chat.completions.create({
    model,
    messages,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty OpenAI response");

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error(
      includeRaw
        ? `OpenAI returned non-JSON. raw=${clip(content)}`
        : "OpenAI returned non-JSON"
    );
  }

  const validated = schema.safeParse(json);
  if (!validated.success) {
    const summary = formatZodIssues(validated.error.issues);
    const raw = includeRaw ? ` raw=${clip(JSON.stringify(json))}` : "";
    throw new Error(`OpenAI response schema mismatch. ${summary}.${raw}`);
  }

  return validated.data;
}


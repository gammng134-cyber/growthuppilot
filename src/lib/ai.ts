import { generateText } from "ai";

export type AiProvider = "google" | "openai";

/** Returns the configured AI provider, or null in demo mode (canned AI). */
export function aiProvider(): AiProvider | null {
  if (process.env.DEMO_MODE === "1") return null;
  const wanted = process.env.AI_PROVIDER as AiProvider | undefined;
  if (wanted === "google" || wanted === "openai") return wanted;
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function aiConfigured(): boolean {
  return aiProvider() !== null;
}

/** Strips ```json fences and extracts the first balanced JSON object/array. */
export function extractJson<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.search(/[[{]/);
  if (start === -1) {
    throw new Error(`No JSON found in model output: ${text.slice(0, 120)}`);
  }
  const opener = text[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === opener) depth++;
    else if (ch === closer) {
      depth--;
      if (depth === 0) {
        const slice = text.slice(start, i + 1);
        return JSON.parse(slice) as T;
      }
    }
  }
  throw new Error(`Unbalanced JSON in model output: ${text.slice(0, 120)}`);
}

/**
 * Runs a structured-generation task. In demo mode returns canned JSON.
 * Task markers (TASK:*) are stripped before hitting real providers.
 */
export async function generateJson<T>(
  system: string,
  userPrompt: string,
): Promise<T> {
  const provider = aiProvider();
  let text: string;
  if (!provider) {
    const { fakeGenerate } = await import("./demo-ai");
    text = await fakeGenerate(system, userPrompt);
  } else {
    const prompt = userPrompt.replace(/^TASK:\S+\n?/m, "");
    if (provider === "google") {
      const { google } = await import("@ai-sdk/google");
      const result = await generateText({
        model: google(process.env.AI_MODEL_GOOGLE || "gemini-2.0-flash"),
        system,
        prompt,
      });
      text = result.text;
    } else {
      const { openai } = await import("@ai-sdk/openai");
      const result = await generateText({
        model: openai(process.env.AI_MODEL_OPENAI || "gpt-4o-mini"),
        system,
        prompt,
      });
      text = result.text;
    }
  }
  return extractJson<T>(text);
}

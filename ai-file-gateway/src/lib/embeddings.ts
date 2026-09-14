import type { Env } from "../types";

/** Embeds a batch of texts with Workers AI. Batches of 100 keep each request comfortably within limits. */
export async function embedBatch(env: Env, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const slice = texts.slice(i, i + 100);
    const result = (await env.AI.run(env.EMBED_MODEL as keyof AiModels, {
      text: slice,
    } as never)) as unknown as { data: number[][] };
    out.push(...result.data);
  }
  return out;
}

export async function embedOne(env: Env, text: string): Promise<number[]> {
  const [vector] = await embedBatch(env, [text]);
  return vector;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Minimal-context chat completion against Workers AI — never sends whole documents, only what callers pass in. */
export async function chat(env: Env, messages: ChatMessage[], maxTokens = 800): Promise<string> {
  const result = (await env.AI.run(env.CHAT_MODEL as keyof AiModels, {
    messages,
    max_tokens: maxTokens,
    temperature: 0.2,
  } as never)) as unknown as { response?: string };
  return result.response ?? "";
}

import { NextResponse } from "next/server";
import { AIProviderError } from "@/lib/ai/provider";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function handleRoute<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const result = await fn();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AIProviderError) {
      return jsonError(`AI provider error: ${err.message}`, 502);
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(message, 400);
  }
}

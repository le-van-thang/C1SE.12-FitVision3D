import { env } from '../../config/env.js';

export interface LlmTurn {
  role: 'user' | 'model';
  text: string;
}

export interface LlmGenerateParams {
  systemInstruction: string;
  history?: LlmTurn[];
  userQuery: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Provider-isolated LLM client.
 * - Passes GEMINI_API_KEY via `x-goog-api-key` header (never in URL query string).
 * - Enforces hard timeout via AbortController so slow upstream calls never hang Express workers.
 * - Returns `null` on missing key / timeout / upstream error so caller can invoke deterministic fallback.
 */
export async function generateLlmReply(params: LlmGenerateParams): Promise<string | null> {
  if (!env.GEMINI_API_KEY) {
    return null;
  }

  const timeoutMs = params.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const turn of params.history ?? []) {
      if (turn.text.trim()) {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text.trim() }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: params.userQuery.trim() }],
    });

    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: params.systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: params.maxOutputTokens ?? 512,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();
    const replyText: string | null = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    return replyText ? replyText.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

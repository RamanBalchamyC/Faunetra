import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant-context";

// Bound worst-case cost/quota usage per request from a single client — this
// is a cheap guard, not real rate limiting or abuse prevention.
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  // Require sign-in so the assistant isn't an open, unauthenticated LLM
  // proxy for anyone who finds the endpoint.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "The AI assistant isn't configured yet (missing GEMINI_API_KEY)." },
      { status: 501 }
    );
  }

  const body = await request.json().catch(() => null);
  const rawMessages = body?.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return NextResponse.json({ error: "messages array is required." }, { status: 400 });
  }

  const messages: ChatMessage[] = rawMessages
    .slice(-MAX_HISTORY_MESSAGES)
    .filter(
      (m): m is ChatMessage =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "No valid messages provided." }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Free-tier-friendly Flash model by default — overridable via env.
  // Google's model lineup and free-tier limits change frequently; if this
  // starts 404ing, the API error itself names the current replacement
  // model (that's how this default was last updated) — check
  // ai.google.dev/pricing too.
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: ASSISTANT_SYSTEM_PROMPT,
        maxOutputTokens: 1024, // short FAQ-style replies — capped for cost/latency
      },
    });

    const reply = response.text ?? "Sorry, I couldn't come up with a response to that.";
    return NextResponse.json({ reply });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "AI assistant misconfigured (invalid API key)." }, { status: 500 });
    }
    if (status === 429) {
      return NextResponse.json(
        { error: "The assistant is busy right now (free-tier rate limit) — try again shortly." },
        { status: 429 }
      );
    }
    const message = err instanceof Error ? err.message : "Unexpected error contacting the assistant.";
    return NextResponse.json({ error: `Assistant error: ${message}` }, { status: 502 });
  }
}

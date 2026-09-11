import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant-context";

// Bound worst-case cost per request from a single client — this is a cheap
// guard, not real rate limiting or abuse prevention.
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The AI assistant isn't configured yet (missing ANTHROPIC_API_KEY)." },
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

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // Model is overridable via ANTHROPIC_MODEL — defaults to Opus 5. For a
    // zero-budget project, claude-haiku-4-5 is the far cheaper choice for a
    // short in-app FAQ bot like this one; set ANTHROPIC_MODEL=claude-haiku-4-5
    // in .env.local / Vercel if you'd rather use that.
    const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024, // short FAQ-style replies — deliberately capped for cost/latency
      system: ASSISTANT_SYSTEM_PROMPT,
      output_config: { effort: "low" }, // simple Q&A doesn't need deep reasoning
      messages,
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const reply = textBlock?.text ?? "Sorry, I couldn't come up with a response to that.";

    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "AI assistant misconfigured (invalid API key)." }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The assistant is busy right now — try again shortly." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Assistant error: ${err.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected error contacting the assistant." }, { status: 500 });
  }
}

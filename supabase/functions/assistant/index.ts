// AI assistant, ported from the Next.js route (src/app/api/assistant/route.ts)
// to a Supabase Edge Function so both the web app and the Expo mobile app
// can call one backend identically via supabase.functions.invoke("assistant", ...).
//
// `withSupabase({ auth: "user" })` validates the caller's JWT before the
// handler ever runs — equivalent to the Next.js route's manual
// `supabase.auth.getUser()` check, just handled by the wrapper instead.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { ASSISTANT_SYSTEM_PROMPT } from "./context.ts";

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;

type ChatMessage = { role: "user" | "assistant"; content: string };

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return Response.json(
        { error: "The AI assistant isn't configured yet (missing GEMINI_API_KEY secret)." },
        { status: 501 }
      );
    }

    const body = await req.json().catch(() => null);
    const rawMessages = body?.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return Response.json({ error: "messages array is required." }, { status: 400 });
    }

    const messages: ChatMessage[] = rawMessages
      .slice(-MAX_HISTORY_MESSAGES)
      .filter(
        (m: unknown): m is ChatMessage =>
          !!m &&
          typeof m === "object" &&
          ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).content === "string" &&
          (m as ChatMessage).content.trim().length > 0
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

    if (messages.length === 0) {
      return Response.json({ error: "No valid messages provided." }, { status: 400 });
    }

    // Free-tier-friendly Flash model by default — overridable via secret.
    // Google's model lineup/free-tier limits change frequently; if this
    // starts 404ing, the API error itself names the current replacement
    // model (that's how the web app's default was last updated).
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash";

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            systemInstruction: { parts: [{ text: ASSISTANT_SYSTEM_PROMPT }] },
            generationConfig: { maxOutputTokens: 1024 },
          }),
        }
      );

      const data = await geminiRes.json();

      if (!geminiRes.ok) {
        const status = geminiRes.status;
        if (status === 401 || status === 403) {
          return Response.json({ error: "AI assistant misconfigured (invalid API key)." }, { status: 500 });
        }
        if (status === 429) {
          return Response.json(
            { error: "The assistant is busy right now (free-tier rate limit) — try again shortly." },
            { status: 429 }
          );
        }
        return Response.json(
          { error: `Assistant error: ${data?.error?.message ?? "Unknown error from Gemini."}` },
          { status: 502 }
        );
      }

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't come up with a response to that.";
      return Response.json({ reply });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error contacting the assistant.";
      return Response.json({ error: `Assistant error: ${message}` }, { status: 500 });
    }
  }),
};

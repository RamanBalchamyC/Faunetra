"use client";

import { useRef, useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { TypingIndicator } from "@/components/TypingIndicator";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "How do I mine coins?",
  "What's the Impact Fund?",
  "What species are rare right now?",
  "Do coins have real money value?",
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-none">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <LogoMark size={20} />
              <span className="text-sm font-semibold">Faunetra Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-text-muted hover:text-primary"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-text-muted">
                  Ask me anything about mining, wallets, or the Impact Fund.
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-text-primary hover:border-accent hover:text-accent"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="mr-2 shrink-0">
                    <LogoMark size={20} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-background text-text-primary" : "bg-black/[0.03] text-text-primary"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2">
                <LogoMark size={20} />
                <TypingIndicator />
              </div>
            )}

            {error && <p className="text-xs text-error">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-surface"
      >
        <LogoMark size={28} />
      </button>
    </>
  );
}

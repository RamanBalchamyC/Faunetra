import { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAppTheme } from "@/hooks/useAppTheme";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "How do I mine coins?",
  "What's the Impact Fund?",
  "Do coins have real money value?",
];

// Calls the Supabase Edge Function (supabase/functions/assistant) rather
// than a Next.js API route — same backend the web app could switch to,
// callable identically from web/iOS/Android via functions.invoke().
export function AssistantWidget() {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("assistant", {
        body: { messages: nextMessages },
      });
      if (invokeError) throw invokeError;
      if (data?.error) {
        setError(data.error);
        return;
      }
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error — please try again.");
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.fab, { backgroundColor: colors.surface, borderColor: colors.primary }]}
      >
        <Text style={{ fontSize: 22 }}>🐙</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
              Faunetra Assistant
            </Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
            {messages.length === 0 && (
              <View style={{ gap: 8 }}>
                <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                  Ask me anything about mining, wallets, or the Impact Fund.
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {STARTER_PROMPTS.map((prompt) => (
                    <Pressable
                      key={prompt}
                      onPress={() => send(prompt)}
                      style={[styles.chip, { borderColor: colors.border }]}
                    >
                      <Text style={{ color: colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                        {prompt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {messages.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  {
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    backgroundColor: m.role === "user" ? colors.background : colors.primary + "14",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                  {m.content}
                </Text>
              </View>
            ))}

            {sending && (
              <Text style={{ color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                Thinking…
              </Text>
            )}
            {error && <Text style={{ color: colors.error, fontFamily: "Inter_400Regular", fontSize: 12 }}>{error}</Text>}
          </ScrollView>

          <View style={[styles.inputRow, { borderTopColor: colors.border }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question…"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
              onSubmitEditing={() => send(input)}
            />
            <Pressable
              onPress={() => send(input)}
              disabled={sending || !input.trim()}
              style={[styles.sendButton, { backgroundColor: colors.primary, opacity: sending || !input.trim() ? 0.6 : 1 }]}
            >
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Send</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: { flex: 1, paddingTop: 50 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  bubble: { maxWidth: "80%", borderRadius: 10, padding: 10, borderWidth: StyleSheet.hairlineWidth },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Inter_400Regular" },
  sendButton: { borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
});

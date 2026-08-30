"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import SuggestionChip from "@/components/ui/SuggestionChip";

const STARTER_PROMPTS = [
  "How's the pipeline looking right now?",
  "Which deals have missing or unclear data?",
  "Summarize this for a leadership update",
];

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "The agent hit an error.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply as string }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-paper">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5">
        {isEmpty && (
          <div className="flex h-full flex-col items-start justify-center gap-4 py-10">
            <p className="max-w-sm text-sm text-ink/50">
              Try one of these, or ask your own question — the agent will query monday.com
              live and flag anything it's unsure about.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((p) => (
                <SuggestionChip key={p} label={p} onClick={sendMessage} disabled={loading} />
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}

        {loading && <TypingIndicator />}

        {error && (
          <div className="rounded-xl border border-rust/30 bg-rust/5 px-4 py-2.5 text-[13px] text-rust">
            {error}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 sm:px-5">
        <MessageInput onSend={sendMessage} disabled={loading} />
      </div>
    </div>
  );
}

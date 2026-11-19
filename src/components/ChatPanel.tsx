"use client";
import { useEffect, useRef, useState } from "react";
import type { Plan } from "@/domain/types";
import { useHawa } from "./Provider";
export default function ChatPanel({
  plan,
  offline,
}: {
  plan: Plan;
  offline: boolean;
}) {
  const { t, profile } = useHawa();
  const [message, setMessage] = useState(""),
    [reply, setReply] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  async function send() {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setReply("");
    setMode("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            ...plan.profile,
            lang: profile.lang,
            simple: profile.simple,
          },
          location: plan.location,
          manualPm: plan.air.pm25,
          message,
          offline,
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const event of events) {
            const raw = event.slice(6);
            if (raw === "[DONE]") continue;
            const data = JSON.parse(raw) as { text?: string; mode?: string };
            if (data.mode) setMode(data.mode);
            if (data.text) setReply((old) => old + data.text);
          }
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    } catch {
      if (!controller.signal.aborted)
        setReply(
          "The assistant is unavailable. Your plan and Learn library still work.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel chat" aria-labelledby="chat-title">
      <h2 id="chat-title">{t.ask}</h2>
      <p>
        Grounded in the guidance library. Not a diagnosis. Responses are
        validated before delivery.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="question">
          {profile.lang === "hi" ? "आपका सवाल" : "Your question"}
        </label>
        <textarea
          id="question"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={800}
          placeholder="How can I reduce smoke in my kitchen?"
        />
        <div className="button-row">
          <button className="primary" disabled={busy}>
            Send
          </button>
          <button
            type="button"
            disabled={!busy}
            onClick={() => {
              abort.current?.abort();
              setBusy(false);
            }}
          >
            Stop
          </button>
        </div>
      </form>
      <p className="fine">{mode && `Response mode: ${mode}`}</p>
      <div
        role={mode === "urgent" ? "alert" : "status"}
        aria-live={mode === "urgent" ? "assertive" : "polite"}
        aria-busy={busy}
        className="reply"
      >
        {reply.split(/(\[kb:[\w-]+\])/).map((part, i) =>
          part.startsWith("[kb:") ? (
            <a key={i} href={`/learn#${part.slice(4, -1)}`}>
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </div>
    </section>
  );
}

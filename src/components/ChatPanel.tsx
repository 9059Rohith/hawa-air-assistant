"use client";
import { useEffect, useRef, useState } from "react";
import type { Plan } from "@/domain/types";
import { useHawa } from "./Provider";
import { localChat } from "@/lib/chat-guidance";
import { urgent } from "@/domain/safety";
export default function ChatPanel({
  plan,
  offline,
}: {
  plan: Plan;
  offline: boolean;
}) {
  const { t, profile, setNotice } = useHawa();
  const hi = profile.lang === "hi";
  const history = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
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
    const current = () =>
      abort.current === controller && !controller.signal.aborted;
    setBusy(true);
    setReply("");
    setMode("");
    let answer = "";
    try {
      if (urgent(message) || offline || !navigator.onLine) {
        const local = localChat(message, profile);
        setReply(local.text);
        setMode(local.mode);
        answer = local.text;
        return;
      }
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
          messages: history.current.slice(-6),
          actionIds: plan.actions.map((a) => a.id),
        }),
        signal: controller.signal,
      });
      if (!current()) {
        void response.body?.cancel().catch(() => {});
        return;
      }
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "";
      const cancelReader = () => {
        void reader.cancel().catch(() => {});
      };
      controller.signal.addEventListener("abort", cancelReader, { once: true });
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done || !current()) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const event of events) {
            const raw = event.slice(6);
            if (raw === "[DONE]") continue;
            const data = JSON.parse(raw) as { text?: string; mode?: string };
            if (data.mode) setMode(data.mode);
            if (data.text) {
              answer += data.text;
              setReply(answer);
            }
          }
        }
      } finally {
        controller.signal.removeEventListener("abort", cancelReader);
        void reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    } catch {
      if (current()) {
        const local = localChat(message, profile);
        setReply(local.text);
        setMode(local.mode);
        answer = local.text;
      }
    } finally {
      if (answer && current())
        history.current = [
          ...history.current,
          { role: "user", content: message },
          { role: "assistant", content: answer.slice(0, 800) },
        ].slice(-6) as typeof history.current;
      if (abort.current === controller) setBusy(false);
    }
  }
  return (
    <section className="panel chat" aria-labelledby="chat-title">
      <h2 id="chat-title">{t.ask}</h2>
      <p>
        {hi
          ? "सलाह पुस्तकालय और आपकी योजना पर आधारित। निदान नहीं। हाल की बातचीत केवल इस टैब में रहती है।"
          : "Grounded in the guidance library and your plan. Not a diagnosis. Recent conversation stays in this tab; online questions send bounded context to the model."}
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
          placeholder={
            hi
              ? "रसोई का धुआँ कैसे कम करें?"
              : "How can I reduce smoke in my kitchen?"
          }
        />
        <div className="button-row">
          <button className="primary" disabled={busy}>
            {hi ? "भेजें" : "Send"}
          </button>
          <button
            type="button"
            disabled={!busy}
            onClick={() => {
              abort.current?.abort();
              setBusy(false);
            }}
          >
            {t.stop}
          </button>
        </div>
      </form>
      <div className="button-row">
        {(hi
          ? [
              "रसोई का धुआँ कैसे कम करें?",
              "मास्क कैसे चुनें?",
              "स्कूल में क्या करें?",
            ]
          : [
              "How can I reduce cooking smoke?",
              "How should a mask fit?",
              "What can our school do?",
            ]
        ).map((q) => (
          <button type="button" key={q} onClick={() => setMessage(q)}>
            {q}
          </button>
        ))}
      </div>
      <p className="fine">
        {busy &&
          (hi
            ? "स्रोतों से उत्तर तैयार हो रहा है…"
            : "Preparing a source-grounded answer…")}
        {mode && `${hi ? "उत्तर मोड" : "Response mode"}: ${mode}`}
      </p>
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
      {reply && (
        <button
          onClick={() =>
            void navigator.clipboard.writeText(reply).then(
              () => setNotice(hi ? "उत्तर कॉपी हुआ।" : "Answer copied."),
              () =>
                setNotice(
                  hi
                    ? "उत्तर चुनकर कॉपी करें।"
                    : "Select the answer to copy it.",
                ),
            )
          }
        >
          {hi ? "उत्तर कॉपी करें" : "Copy answer"}
        </button>
      )}
    </section>
  );
}

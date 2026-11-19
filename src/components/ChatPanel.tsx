"use client";
import type { Plan } from "@/domain/types";
import { useHawa } from "./Provider";
import { useChat } from "@/hooks/useChat";
export default function ChatPanel({
  plan,
  offline,
}: {
  plan: Plan;
  offline: boolean;
}) {
  const { t, profile, setNotice } = useHawa();
  const hi = profile.lang === "hi";
  const { message, setMessage, reply, busy, mode, send, stop } = useChat(
    plan,
    offline,
    profile,
  );
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
          <button type="button" disabled={!busy} onClick={stop}>
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
            void (
              navigator.clipboard?.writeText(reply) ??
              Promise.reject(new Error("Clipboard unavailable"))
            ).then(
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

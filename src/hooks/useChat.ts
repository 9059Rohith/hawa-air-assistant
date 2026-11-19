"use client";
import { useEffect, useRef, useState } from "react";
import type { Plan, Profile } from "@/domain/types";
import { localChat } from "@/lib/chat-guidance";
import { urgent } from "@/domain/safety";
import { consumeChatStream } from "@/lib/chat-stream";
/** Owns request cancellation and short-lived conversation state separately from rendering. */
export function useChat(plan: Plan, offline: boolean, profile: Profile) {
  const history = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const [message, setMessage] = useState(""),
    [reply, setReply] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    history.current = [];
    setReply("");
    setMode("");
    setBusy(false);
    return () => abort.current?.abort();
  }, [plan, profile.lang, profile.simple]);
  async function send() {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const current = () =>
      abort.current === controller && !controller.signal.aborted;
    const deadline = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(30000),
    ]);
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
        signal: deadline,
      });
      if (!current()) {
        void response.body?.cancel().catch(() => {});
        return;
      }
      if (!response.ok || !response.body) throw new Error();
      await consumeChatStream(response.body, deadline, (event) => {
        if (!current()) return;
        if ("mode" in event) setMode(event.mode);
        else {
          answer += event.text;
          setReply(answer);
        }
      });
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
        ] satisfies typeof history.current;
      history.current = history.current.slice(-6);
      if (current()) setBusy(false);
    }
  }

  function stop() {
    abort.current?.abort();
    setBusy(false);
  }
  return { message, setMessage, reply, busy, mode, send, stop };
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Owns one utterance; stale browser callbacks cannot update a newer playback. */
export function useReadAloud(
  text: string,
  lang: "en" | "hi",
  resetSignal: AbortSignal,
) {
  const current = useRef<SpeechSynthesisUtterance | null>(null);
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<"idle" | "speaking" | "paused">("idle");
  const [failed, setFailed] = useState(false);
  const cancel = useCallback(() => {
    const utterance = current.current;
    current.current = null;
    if (!utterance) return;
    utterance.onend = null;
    utterance.onerror = null;
    window.speechSynthesis?.cancel();
  }, []);
  const stop = useCallback(() => {
    try {
      cancel();
      setFailed(false);
    } catch {
      setFailed(true);
    }
    setStatus("idle");
  }, [cancel]);
  useEffect(() => {
    setAvailable(
      typeof window.SpeechSynthesisUtterance === "function" &&
        typeof window.speechSynthesis?.speak === "function",
    );
    stop();
    resetSignal.addEventListener("abort", stop);
    return () => {
      resetSignal.removeEventListener("abort", stop);
      try {
        cancel();
      } catch {
        /* Cleanup must not crash navigation. */
      }
    };
  }, [text, lang, resetSignal, stop, cancel]);
  function start() {
    if (resetSignal.aborted) return;
    try {
      cancel();
      // cancel() leaves the browser's global paused state unchanged.
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
      const finish = (error: boolean) => {
        if (current.current !== utterance) return;
        current.current = null;
        utterance.onend = null;
        utterance.onerror = null;
        setStatus("idle");
        setFailed(error);
      };
      utterance.onend = () => finish(false);
      utterance.onerror = () => finish(true);
      current.current = utterance;
      setFailed(false);
      setStatus("speaking");
      window.speechSynthesis.speak(utterance);
    } catch {
      stop();
      setFailed(true);
    }
  }
  function togglePause() {
    if (status === "idle") return;
    try {
      if (status === "paused") window.speechSynthesis.resume();
      else window.speechSynthesis.pause();
      setStatus(status === "paused" ? "speaking" : "paused");
    } catch {
      stop();
      setFailed(true);
    }
  }
  return { available, status, failed, start, stop, togglePause };
}

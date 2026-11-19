"use client";
import { useEffect, useState } from "react";
import { useHawa } from "./Provider";
export function ReadAloud({ text }: { text: string }) {
  const { t, profile } = useHawa();
  const [available, setAvailable] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setAvailable("speechSynthesis" in window);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);
  return available ? (
    <div className="button-row">
      <button
        onClick={() => {
          speechSynthesis.cancel();
          setPaused(false);
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = profile.lang === "hi" ? "hi-IN" : "en-IN";
          speechSynthesis.speak(utterance);
        }}
      >
        {t.read}
      </button>
      <button
        onClick={() => {
          if (paused) speechSynthesis.resume();
          else speechSynthesis.pause();
          setPaused(!paused);
        }}
      >
        {profile.lang === "hi"
          ? paused
            ? "जारी रखें"
            : "रोकें"
          : paused
            ? "Resume"
            : "Pause"}
      </button>
      <button
        onClick={() => {
          speechSynthesis.cancel();
          setPaused(false);
        }}
      >
        {t.stop}
      </button>
    </div>
  ) : (
    <p>Read-aloud is unavailable in this browser.</p>
  );
}

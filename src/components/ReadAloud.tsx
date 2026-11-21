"use client";
import { useHawa } from "./Provider";
import { useReadAloud } from "@/hooks/useReadAloud";
export function ReadAloud({ text }: { text: string }) {
  const { t, profile, resetSignal } = useHawa();
  const { available, status, failed, start, stop, togglePause } = useReadAloud(
    text,
    profile.lang,
    resetSignal,
  );
  const paused = status === "paused";
  return available ? (
    <div className="button-row">
      <button type="button" onClick={start}>
        {t.read}
      </button>
      <button
        type="button"
        disabled={status === "idle"}
        aria-pressed={paused}
        onClick={togglePause}
      >
        {profile.lang === "hi"
          ? paused
            ? "जारी रखें"
            : "विराम दें"
          : paused
            ? "Resume"
            : "Pause"}
      </button>
      <button type="button" disabled={status === "idle"} onClick={stop}>
        {t.stop}
      </button>
      {failed && (
        <p role="alert">
          {profile.lang === "hi"
            ? "आवाज़ में पढ़ना अभी उपलब्ध नहीं है। फिर कोशिश करें या पाठ पढ़ें।"
            : "Read-aloud is unavailable right now. Try again or read the text."}
        </p>
      )}
    </div>
  ) : (
    <p>
      {profile.lang === "hi"
        ? "इस ब्राउज़र में आवाज़ में पढ़ना उपलब्ध नहीं है।"
        : "Read-aloud is unavailable in this browser."}
    </p>
  );
}

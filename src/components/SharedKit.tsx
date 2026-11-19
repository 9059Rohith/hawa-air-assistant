"use client";
import { useEffect, useState } from "react";
import { knowledge } from "@/data/knowledge";
import { readSharedKit } from "@/lib/share";
export function SharedKit() {
  const [kit, setKit] = useState<ReturnType<typeof readSharedKit>>(null);
  useEffect(() => {
    const read = () =>
      setKit(
        readSharedKit(
          location.hash,
          knowledge.map((a) => a.id),
        ),
      );
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);
  if (!kit) return null;
  const hi = kit.lang === "hi";
  return (
    <section className="panel" lang={kit.lang}>
      <h2>{hi ? "साझा साफ हवा के कदम" : "Shared clean-air steps"}</h2>
      <p>
        {hi
          ? "इस लिंक में किसी परिवार की निजी जानकारी नहीं है। अपनी ज़रूरत के अनुसार जाँचें।"
          : "This link contains no household details. Review these actions for your own circumstances."}
      </p>
      <ul>
        {kit.ids.map((id) => {
          const a = knowledge.find((x) => x.id === id)!;
          return (
            <li key={id}>
              <strong>{hi ? a.hi.title : a.title}</strong>
              <p>{hi ? a.hi.summary : a.summary}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

"use client";
import type { ReactNode } from "react";
import { useHawa } from "./Provider";
export function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
export function Notice() {
  const { notice } = useHawa();
  return (
    <p role="status" className={notice ? "notice" : "sr-only"}>
      {notice}
    </p>
  );
}
export function Footer() {
  const { t } = useHawa();
  return (
    <footer>
      <strong>HAWA ≋</strong>
      <p>{t.general}</p>
      <small>{t.privacy}</small>
    </footer>
  );
}

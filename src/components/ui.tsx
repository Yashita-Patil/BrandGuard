import { statusTone } from "@/lib/labels";
import type { DocStatus, Severity } from "@/lib/types";

export function Tag({
  tone,
  children,
}: {
  tone: "neutral" | "warn" | "danger" | "ok" | "high" | "medium" | "low";
  children: React.ReactNode;
}) {
  const cls = {
    neutral: "bg-slate-100 text-slate-700",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800",
    ok: "bg-emerald-100 text-emerald-800",
    high: "bg-rose-100 text-rose-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-sky-100 text-sky-800",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function StatusTag({ status }: { status: DocStatus }) {
  return <Tag tone={statusTone(status)}>{status.replace("_", " ")}</Tag>;
}

export function SevTag({ sev }: { sev: Severity }) {
  return <Tag tone={sev}>{sev}</Tag>;
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "primary" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls = {
    ghost:
      "border-navy/15 bg-white text-navy hover:bg-navy/5",
    primary: "border-navy bg-navy text-white hover:bg-navy/90",
    danger: "border-rose-700 bg-rose-700 text-white hover:bg-rose-800",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="font-display text-lg text-navy">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-navy/15 bg-paper px-3 py-2 text-sm text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/20";

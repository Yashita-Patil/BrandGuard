"use client";

import { useState } from "react";
import { openFindings, isSafeFix } from "@/lib/engine";
import { mockRewrite } from "@/lib/rewrite";
import { useStore } from "@/lib/store";
import type { RewriteProposal } from "@/lib/types";
import { Button, Card, Tag } from "./ui";

export function RewritePanel() {
  const { current, state, me, acceptRewrite, discardRewrite, pendingRewrite, setPendingRewrite } =
    useStore();
  const [busy, setBusy] = useState(false);
  const open = openFindings(current.lastFindings, current.dismissed);
  const remaining = open.filter((finding) => !isSafeFix(finding));
  const editable =
    current.status === "draft" || current.status === "changes_requested";

  async function propose() {
    setBusy(true);
    const payload = {
      text: current.text,
      alt: current.alt,
      fg: current.fg,
      bg: current.bg,
      hasImg: current.hasImg,
      rules: state.rules,
      facts: state.facts,
      dismissed: current.dismissed,
    };
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("rewrite failed");
      const proposal = (await res.json()) as RewriteProposal;
      setPendingRewrite(proposal);
    } catch {
      setPendingRewrite(mockRewrite(payload));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Brand-grounded rewrite"
      action={
        pendingRewrite ? (
          <Tag tone={pendingRewrite.source === "openai" ? "ok" : "neutral"}>
            {pendingRewrite.source === "openai" ? "Live model" : "Kit-grounded mock"}
          </Tag>
        ) : null
      }
    >
      <p className="text-sm text-slate-600">
        Apply all safe fixes first for deterministic terminology and facts. This rewrite
        only targets remaining issues (claims, hype, accessibility wording). The rule
        engine re-checks the proposal — AI cannot mark something clear on its own.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void propose()} disabled={!editable || busy}>
          {busy ? "Rewriting…" : "Rewrite in brand voice"}
        </Button>
        {remaining.length > 0 && (
          <span className="self-center text-xs text-slate-500">
            {remaining.length} remaining issue{remaining.length === 1 ? "" : "s"} after safe
            fixes
          </span>
        )}
      </div>
      {pendingRewrite && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-rose-700">Before</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-rose-50 p-3 text-sm">
                {pendingRewrite.beforeText}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-emerald-700">After</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-emerald-50 p-3 text-sm">
                {pendingRewrite.afterText}
              </pre>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Why this changed</p>
            <ul className="mt-1 space-y-1 text-sm">
              {pendingRewrite.changes.map((change, i) => (
                <li key={`${change.src}-${i}`}>
                  <s className="text-rose-700">{change.before}</s> → <b>{change.after}</b>
                  <div className="text-xs text-slate-500">
                    {change.reason} · {change.src}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Kit citations</p>
            <ul className="mt-1 space-y-1 text-sm">
              {pendingRewrite.citations.map((cite) => (
                <li key={cite.src}>
                  <b>{cite.src}</b> — {cite.note}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">
            Engine re-check of this proposal: {pendingRewrite.remainingOpen} open finding
            {pendingRewrite.remainingOpen === 1 ? "" : "s"}. Signed in as {me.name}. Nothing
            is applied until you accept.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={acceptRewrite} disabled={!editable}>
              Accept rewrite
            </Button>
            <Button onClick={discardRewrite}>Discard proposal</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

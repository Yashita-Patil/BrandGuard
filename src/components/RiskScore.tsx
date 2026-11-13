"use client";

import { scoreRisk, riskLabel } from "@/lib/risk";
import { useStore } from "@/lib/store";
import { assertNever } from "@/lib/types";
import type { HistoryAction, RiskLevel } from "@/lib/types";
import { Card, SevTag, Tag } from "./ui";

function countsAsScan(action: HistoryAction): boolean {
  switch (action) {
    case "scanned":
    case "applied_fix":
    case "applied_all_safe":
    case "accepted_rewrite":
    case "submitted":
    case "resubmitted":
    case "restored":
      return true;
    case "created":
    case "saved":
    case "dismissed":
    case "requested_changes":
    case "approved":
    case "override_approved":
    case "commented":
    case "proposed_rewrite":
    case "discarded_rewrite":
      return false;
    default:
      return assertNever(action, "Unknown history action");
  }
}

function levelTone(level: RiskLevel): "ok" | "warn" | "danger" {
  switch (level) {
    case "ship":
      return "ok";
    case "hold":
      return "warn";
    case "block":
      return "danger";
    default:
      return assertNever(level, "Unknown risk tone");
  }
}

export function RiskScoreCard() {
  const { current, state } = useStore();
  const score = scoreRisk(current, state.rules, state.facts);
  const scanned =
    current.lastFindings.length > 0 || current.history.some((entry) => countsAsScan(entry.action));

  return (
    <Card
      title="Publication risk"
      action={<Tag tone={levelTone(score.level)}>{riskLabel(score.level)}</Tag>}
    >
      {!scanned ? (
        <p className="text-sm text-slate-500">
          Run a brand check. Ship / Hold / Block is computed from open findings — not from
          the rewriter.
        </p>
      ) : (
        <>
          <p className="text-sm">{score.summary}</p>
          <p className="mt-2 text-xs text-slate-500">
            {score.high} high · {score.medium} medium · {score.low} low. Evidence below is
            the rule engine, with a one-line business risk for each open issue.
          </p>
          {score.evidence.length > 0 && (
            <ul className="mt-3 space-y-2">
              {score.evidence.map((item) => (
                <li key={`${item.ruleId}-${item.match}`} className="rounded-lg bg-paper p-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <SevTag sev={item.sev} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Rule match: “{item.match}” · {item.src}
                  </p>
                  <p className="mt-1">{item.businessRisk}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

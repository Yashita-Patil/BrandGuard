"use client";

import { openFindings } from "@/lib/engine";
import { filterGroups, groupFindings, safeFixCount } from "@/lib/grouping";
import { severityLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Severity } from "@/lib/types";
import { Button, Card, SevTag, Tag } from "./ui";

const FILTERS: ("all" | Severity)[] = ["all", "high", "medium", "low"];

export function Findings() {
  const {
    current,
    state,
    session,
    setSeverityFilter,
    applyGroup,
    dismissGroup,
    applyAllSafe,
  } = useStore();
  const scanned = current.lastFindings.length > 0 || current.history.some((h) => h.action === "scanned");
  const open = openFindings(current.lastFindings, current.dismissed);
  const groups = filterGroups(
    groupFindings(open, state.rules, state.facts),
    session.severityFilter,
  );
  const allGroups = groupFindings(open, state.rules, state.facts);
  const safe = safeFixCount(allGroups);
  const dismissedCount = current.lastFindings.length - open.length;
  const uniqueBefore = current.lastFindings.reduce((n, f) => n + f.occurrences, 0);
  const uniqueAfter = open.length;
  const editable =
    current.status === "draft" || current.status === "changes_requested";

  return (
    <Card
      title="Findings"
      action={
        open.length ? (
          <Tag tone={open.length ? "warn" : "ok"}>{open.length} open</Tag>
        ) : null
      }
    >
      {!scanned && current.lastFindings.length === 0 ? (
        <p className="text-sm text-slate-500">
          Run the brand check to see issues. Repeat matches are grouped, duplicates of the
          same phrase are counted once, and nothing changes until you apply a fix.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSeverityFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  session.severityFilter === filter
                    ? "bg-navy text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {filter === "all" ? "All severities" : severityLabel(filter)}
              </button>
            ))}
            <Button variant="primary" onClick={applyAllSafe} disabled={!safe || !editable}>
              Apply all safe fixes{safe ? ` (${safe})` : ""}
            </Button>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            {uniqueBefore} raw matches collapsed into {uniqueAfter} unique findings and{" "}
            {allGroups.length} grouped issues. Safe fixes are deterministic replacements
            (terminology, facts, punctuation). Claims, tone hype, and accessibility stay
            for <b>Rewrite in brand voice</b> — that proposal is not applied until you accept.
          </p>
          {groups.length === 0 ? (
            <p>
              <Tag tone="ok">Clear</Tag>{" "}
              <span className="text-sm">No open findings in this filter.</span>
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <article
                  key={group.ruleId}
                  className={`rounded-xl border-l-4 bg-paper p-3 ${
                    group.sev === "high"
                      ? "border-rose-600"
                      : group.sev === "medium"
                        ? "border-amber-500"
                        : "border-sky-500"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <SevTag sev={group.sev} />
                    <Tag tone="neutral">{group.cat}</Tag>
                    {group.count > 1 && (
                      <Tag tone="warn">
                        {group.count} similar · {group.uniqueMatches} variants grouped
                      </Tag>
                    )}
                  </div>
                  <p className="font-medium text-navy">{group.label}</p>
                  <p className="mt-1 text-sm">{group.why}</p>
                  <p className="mt-1 text-xs text-slate-500">Source: {group.src}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {group.findings.map((finding) => (
                      <li key={finding.key}>
                        {finding.fix ? (
                          <>
                            <s className="text-rose-700">{finding.match}</s>
                            {" → "}
                            <b>{finding.fix}</b>
                            {finding.occurrences > 1 ? ` ×${finding.occurrences}` : ""}
                          </>
                        ) : (
                          <>
                            <b>{finding.match}</b>
                            {finding.hint ? ` — ${finding.hint}` : ""}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.hasSafeFix && (
                      <Button
                        variant="primary"
                        onClick={() => applyGroup(group.ruleId)}
                        disabled={!editable}
                      >
                        Apply grouped fix
                      </Button>
                    )}
                    <Button onClick={() => dismissGroup(group.ruleId)}>Dismiss group</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {dismissedCount > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {dismissedCount} finding(s) dismissed (logged in history).
            </p>
          )}
        </>
      )}
    </Card>
  );
}

"use client";

import { computeAnalytics } from "@/lib/analytics";
import { formatWhen } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { Card, Tag } from "./ui";

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const width = max ? Math.max(6, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm">{label}</span>
      <div className="h-3 flex-1 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-navy" style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 text-right text-sm text-slate-500">{value}</span>
    </div>
  );
}

function Donut({ approved, rest }: { approved: number; rest: number }) {
  const total = approved + rest || 1;
  const approvedPct = (approved / total) * 100;
  return (
    <svg viewBox="0 0 36 36" className="h-36 w-36">
      <circle cx="18" cy="18" r="14" fill="none" stroke="#E8EEF9" strokeWidth="4" pathLength={100} />
      <circle
        cx="18"
        cy="18"
        r="14"
        fill="none"
        stroke="#0B3D91"
        strokeWidth="4"
        pathLength={100}
        strokeDasharray={`${approvedPct} ${100 - approvedPct}`}
        strokeDashoffset="25"
        strokeLinecap="round"
      />
      <text x="18" y="19" textAnchor="middle" fontSize="6" fill="#0B3D91" fontWeight="700">
        {Math.round((approved / total) * 100)}%
      </text>
    </svg>
  );
}

export function Analytics() {
  const { state } = useStore();
  const data = computeAnalytics(state.docs, state.rules, state.facts);
  const maxCat = Math.max(1, ...data.categories.map((c) => c.count));
  const maxType = Math.max(1, ...data.byType.map((t) => t.reviewed));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        These charts are computed from submissions currently in the queue — including
        sample Northwind content and anything you scan, submit, or approve in this session.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Content reviewed" value={String(data.totalReviewed)} hint="Submitted at least once" />
        <Stat
          label="Approval rate"
          value={`${Math.round(data.approvalRate * 100)}%`}
          hint={`${data.approved} approved of ${data.totalReviewed} reviewed`}
        />
        <Stat label="In review" value={String(data.inReview)} hint="Waiting on a reviewer" />
        <Stat
          label="Changes requested"
          value={String(data.changesRequested)}
          hint={`${Math.round(data.resubmitRate * 100)}% have been resubmitted`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Approval mix">
          <div className="flex items-center gap-4">
            <Donut approved={data.approved} rest={data.totalReviewed - data.approved} />
            <ul className="space-y-1 text-sm">
              <li>
                <Tag tone="ok">Approved</Tag> {data.approved}
              </li>
              <li>
                <Tag tone="warn">In review</Tag> {data.inReview}
              </li>
              <li>
                <Tag tone="danger">Changes requested</Tag> {data.changesRequested}
              </li>
              <li>
                <Tag tone="neutral">Drafts</Tag> {data.drafts}
              </li>
            </ul>
          </div>
        </Card>
        <Card title="Category-wise violations">
          {data.categories.length === 0 ? (
            <p className="text-sm text-slate-500">No open findings on reviewed content.</p>
          ) : (
            <div className="space-y-2">
              {data.categories.map((cat) => (
                <Bar key={cat.cat} label={cat.cat} value={cat.count} max={maxCat} />
              ))}
            </div>
          )}
        </Card>
        <Card title="Frequently occurring brand issues">
          {data.frequentIssues.length === 0 ? (
            <p className="text-sm text-slate-500">No recurring issues yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="py-1">Issue</th>
                  <th className="py-1">Category</th>
                  <th className="py-1">Flags</th>
                  <th className="py-1">Pieces</th>
                </tr>
              </thead>
              <tbody>
                {data.frequentIssues.map((issue) => (
                  <tr key={issue.ruleId} className="border-t border-navy/10">
                    <td className="py-2 pr-2">{issue.label}</td>
                    <td className="py-2 pr-2">{issue.cat}</td>
                    <td className="py-2 pr-2">{issue.count}</td>
                    <td className="py-2">{issue.docs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Reviewed by format">
          <div className="space-y-2">
            {data.byType.map((row) => (
              <Bar
                key={row.type}
                label={row.type}
                value={row.reviewed}
                max={maxType}
              />
            ))}
          </div>
        </Card>
      </div>
      <Card title="Transparent decisions from real reviews">
        {data.recentDecisions.length === 0 ? (
          <p className="text-sm text-slate-500">No reviewer decisions recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.recentDecisions.map((item) => (
              <li key={`${item.t}-${item.title}`} className="border-b border-navy/10 pb-2">
                <b>{item.title}</b> — {item.who} · {item.outcome.replace("_", " ")} ·{" "}
                {formatWhen(item.t)}
                <div className="text-slate-600">{item.note}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-display text-3xl text-navy">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

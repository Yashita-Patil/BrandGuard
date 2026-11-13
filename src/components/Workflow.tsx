"use client";

import { useState } from "react";
import { openFindings } from "@/lib/engine";
import { draftOverrideJustification, scoreRisk } from "@/lib/risk";
import { commentKindLabel, formatWhen, historyActionLabel, roleLabel, statusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { Button, Card, StatusTag, Tag, inputClass } from "./ui";

export function Workflow() {
  const { current, me, state, requestChanges, approve, addComment, restore } = useStore();
  const [changeNote, setChangeNote] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [overrideNote, setOverrideNote] = useState("");
  const [comment, setComment] = useState("");
  const [coachSource, setCoachSource] = useState<"mock" | "openai" | "">("");
  const [coachBusy, setCoachBusy] = useState(false);
  const high = openFindings(current.lastFindings, current.dismissed).filter(
    (finding) => finding.sev === "high",
  );
  const canDecide =
    Boolean(current.id) &&
    current.status === "in_review" &&
    me.role !== "creator" &&
    current.author !== me.name;
  const canEdit =
    current.status === "draft" || current.status === "changes_requested";

  if (!current.id) {
    return (
      <Card title="Review workflow">
        <p className="text-sm text-slate-500">Save or scan content to start a review trail.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card title="Review workflow">
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag status={current.status} />
          <span className="text-sm text-slate-600">Revision {current.revision || 0}</span>
        </div>
        <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-500">Creator</dt>
            <dd>
              {current.author} · {roleLabel(current.authorRole)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Reviewer</dt>
            <dd>
              {current.reviewer
                ? `${current.reviewer} · ${current.reviewerRole ? roleLabel(current.reviewerRole) : ""}`
                : "Not yet assigned"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Approver</dt>
            <dd>
              {current.approver
                ? `${current.approver} · ${current.approverRole ? roleLabel(current.approverRole) : ""}`
                : "Not yet approved"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Status</dt>
            <dd>{statusLabel(current.status)}</dd>
          </div>
        </dl>

        {current.status === "in_review" && !canDecide && (
          <p className="mt-3 text-sm text-slate-500">
            Waiting for a manager or reviewer who is not the author. Use the role switcher
            in the header.
          </p>
        )}

        {current.status === "changes_requested" && (
          <p className="mt-3 text-sm text-amber-800">
            Changes requested. The creator should edit the copy, then resubmit.
          </p>
        )}

        {canDecide && (
          <div className="mt-4 space-y-3 rounded-xl bg-paper p-3">
            <p className="text-sm font-medium">Decision</p>
            <textarea
              className={`${inputClass} min-h-20`}
              placeholder="What needs to change? Reviewer comments are required."
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
            />
            <Button
              variant="danger"
              onClick={() => {
                requestChanges(changeNote);
                setChangeNote("");
              }}
              disabled={!changeNote.trim()}
            >
              Request changes
            </Button>
            <textarea
              className={`${inputClass} min-h-16`}
              placeholder="Approval note (visible on the decision trail)"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
            />
            {high.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-rose-700">
                  {high.length} high-severity finding(s) are still open. The engine still
                  recommends Block. Draft an override, then edit it before you approve.
                </p>
                <Button
                  onClick={async () => {
                    setCoachBusy(true);
                    const draft = draftOverrideJustification(
                      scoreRisk(current, state.rules, state.facts),
                      current.title,
                    );
                    try {
                      const res = await fetch("/api/override", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ title: current.title, draft }),
                      });
                      if (!res.ok) throw new Error("coach failed");
                      const data = (await res.json()) as {
                        text: string;
                        source: "mock" | "openai";
                      };
                      setOverrideNote(data.text);
                      setCoachSource(data.source);
                    } catch {
                      setOverrideNote(draft);
                      setCoachSource("mock");
                    } finally {
                      setCoachBusy(false);
                    }
                  }}
                  disabled={coachBusy}
                >
                  {coachBusy ? "Drafting…" : "Draft override with AI"}
                </Button>
                {coachSource ? (
                  <p className="text-xs text-slate-500">
                    {coachSource === "openai" ? "Live model draft" : "Kit-grounded draft"} —
                    edit before approving. This does not clear the findings.
                  </p>
                ) : null}
                <textarea
                  className={`${inputClass} min-h-24`}
                  placeholder="Override justification (required). Use Draft override with AI, then edit."
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                />
              </div>
            )}
            <Button
              variant="primary"
              onClick={() => {
                approve(approveNote, high.length ? overrideNote : undefined);
                setApproveNote("");
                setOverrideNote("");
              }}
              disabled={high.length > 0 && !overrideNote.trim()}
            >
              Approve
            </Button>
          </div>
        )}
      </Card>

      <Card title="Decision trail">
        {current.decisions.length === 0 ? (
          <p className="text-sm text-slate-500">No approval decisions yet.</p>
        ) : (
          <ul className="space-y-3">
            {current.decisions.map((decision) => (
              <li key={decision.t} className="border-b border-navy/10 pb-3 text-sm last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={decision.outcome === "approved" ? "ok" : "danger"}>
                    {decision.outcome === "approved" ? "Approved" : "Changes requested"}
                  </Tag>
                  {decision.override && <Tag tone="warn">Override</Tag>}
                  <span className="font-medium">{decision.who}</span>
                  <span className="text-slate-500">
                    {roleLabel(decision.role)} · {formatWhen(decision.t)}
                  </span>
                </div>
                <p className="mt-1">{decision.note}</p>
                {decision.openHighCount > 0 && (
                  <p className="text-xs text-rose-700">
                    {decision.openHighCount} high-severity finding(s) were open.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Comments">
        {current.comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {current.comments.map((item) => (
              <li key={`${item.t}-${item.who}`} className="border-b border-navy/10 pb-3 text-sm last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone="neutral">{commentKindLabel(item.kind)}</Tag>
                  <b>{item.who}</b>
                  <span className="text-slate-500">
                    {roleLabel(item.role)} · {formatWhen(item.t)}
                  </span>
                </div>
                <p className="mt-1">{item.text}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <input
            className={inputClass}
            placeholder="Add a comment"
            aria-label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button
            onClick={() => {
              addComment(comment);
              setComment("");
            }}
          >
            Post
          </Button>
        </div>
      </Card>

      <Card title="Revision history">
        {current.history.length === 0 ? (
          <p className="text-sm text-slate-500">No revisions yet.</p>
        ) : (
          <ul className="space-y-3">
            {current.history.map((entry, index) => (
              <li key={`${entry.t}-${index}`} className="border-b border-navy/10 pb-3 text-sm last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone="neutral">{historyActionLabel(entry.action)}</Tag>
                  <b>{entry.who}</b>
                  <span className="text-slate-500">{formatWhen(entry.t)}</span>
                </div>
                <p className="mt-1">{entry.what}</p>
                {canEdit && index > 0 && (
                  <div className="mt-2">
                    <Button onClick={() => restore(index)}>Restore this text</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

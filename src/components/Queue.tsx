"use client";

import { formatWhen, statusLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import { Button, Card, StatusTag } from "./ui";

export function Queue() {
  const { state, openDoc } = useStore();
  return (
    <Card title="Review queue">
      {state.docs.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nothing here yet. Create content on Review, save it, and submit it.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase text-slate-500">
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Format</th>
                <th className="py-2 pr-3">Creator</th>
                <th className="py-2 pr-3">Reviewer</th>
                <th className="py-2 pr-3">Approver</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Rev</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {state.docs.map((doc) => (
                <tr key={doc.id} className="border-b border-navy/5">
                  <td className="py-2 pr-3 font-medium">{doc.title || "Untitled"}</td>
                  <td className="py-2 pr-3">{doc.type}</td>
                  <td className="py-2 pr-3">{doc.author}</td>
                  <td className="py-2 pr-3">{doc.reviewer ?? "—"}</td>
                  <td className="py-2 pr-3">{doc.approver ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <StatusTag status={doc.status} />
                    <span className="sr-only">{statusLabel(doc.status)}</span>
                  </td>
                  <td className="py-2 pr-3">{doc.revision}</td>
                  <td className="py-2">
                    <Button onClick={() => openDoc(doc.id)}>Open</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            Submitted pieces stay in this queue. Latest activity:{" "}
            {formatWhen(
              Math.max(
                ...state.docs.map((doc) => doc.submittedAt ?? doc.history[0]?.t ?? 0),
              ),
            )}
            .
          </p>
        </div>
      )}
    </Card>
  );
}

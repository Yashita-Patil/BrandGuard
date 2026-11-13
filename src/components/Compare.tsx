"use client";

import { useStore } from "@/lib/store";
import { Card } from "./ui";

export function Compare() {
  const { current } = useStore();
  const before = current.originalText || current.text;
  const after = current.text;
  const changed = before !== after;
  return (
    <Card title="Before and after">
      {!changed && !current.appliedFixes.length ? (
        <p className="text-sm text-slate-500">
          Original copy is captured on first scan or sample load. Apply safe fixes to
          compare the creator’s draft with the corrected version.
        </p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-rose-700">Before</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-rose-50 p-3 text-sm text-navy">
                {before || "—"}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-emerald-700">After</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-emerald-50 p-3 text-sm text-navy">
                {after || "—"}
              </pre>
            </div>
          </div>
          {current.appliedFixes.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                Applied replacements
              </p>
              <ul className="space-y-1 text-sm">
                {current.appliedFixes.slice(0, 12).map((fix, i) => (
                  <li key={`${fix.t}-${i}`}>
                    <s className="text-rose-700">{fix.match}</s> → <b>{fix.fix}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

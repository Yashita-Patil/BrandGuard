"use client";

import { USERS } from "@/lib/brand";
import { useStore } from "@/lib/store";
import { Button } from "./ui";

export function Landing() {
  const { startDemo } = useStore();
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-2xl text-navy">BrandGuard</p>
            <p className="text-sm text-slate-500">Pre-publication brand governance</p>
          </div>
          <Button variant="primary" onClick={() => startDemo("creator")}>
            Start judge demo
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Northwind · Round 3 product
        </p>
        <h1 className="font-display text-4xl leading-tight text-navy md:text-5xl">
          Check content against approved brand sources before it goes live.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Creators scan copy, apply grouped safe fixes, rewrite remaining issues in brand
          voice, and submit. Reviewers request changes with comments. Managers see a
          ship/hold/block score and can draft an override. Analytics come from real
          submissions.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => startDemo("creator")}>
            Enter as {USERS.creator.name} (Creator)
          </Button>
          <Button onClick={() => startDemo("reviewer")}>
            Enter as {USERS.reviewer.name} (Reviewer)
          </Button>
          <Button onClick={() => startDemo("manager")}>
            Enter as {USERS.manager.name} (Manager)
          </Button>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Compliance engine",
              d: "Grouped violations, severity filters, Apply all safe fixes, and a before/after comparison.",
            },
            {
              n: "2",
              t: "Review workflow",
              d: "Request changes with comments, edit and resubmit, named reviewer/approver, revision history.",
            },
            {
              n: "3",
              t: "Live analytics",
              d: "Totals, approval rates, category breakdowns, and frequent issues from actual queued content.",
            },
          ].map((item) => (
            <li key={item.n} className="rounded-2xl border border-navy/10 bg-white p-5">
              <p className="font-display text-3xl text-gold">{item.n}</p>
              <h2 className="mt-2 font-display text-xl text-navy">{item.t}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.d}</p>
            </li>
          ))}
        </ol>
        <section className="mt-10 rounded-2xl border border-navy/10 bg-navy px-6 py-5 text-white">
          <h2 className="font-display text-xl">First-run path (about 4 minutes)</h2>
          <p className="mt-2 text-sm text-white/80">
            Landing → sample launch post → Run brand check → filter High → Apply all
            safe fixes → compare before/after → Submit → switch to Meera → Request
            changes → switch to Asha → edit and resubmit → switch to Ravi → Approve →
            open Analytics.
          </p>
        </section>
      </main>
    </div>
  );
}

"use client";

import { USERS } from "@/lib/brand";
import { tabLabel } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Role, Tab } from "@/lib/types";
import { assertNever } from "@/lib/types";
import { Analytics } from "./Analytics";
import { BrandKit } from "./BrandKit";
import { Compare } from "./Compare";
import { Editor } from "./Editor";
import { Findings } from "./Findings";
import { Queue } from "./Queue";
import { RewritePanel } from "./RewritePanel";
import { RiskScoreCard } from "./RiskScore";
import { Trust } from "./Trust";
import { Workflow } from "./Workflow";

function renderTab(tab: Tab) {
  switch (tab) {
    case "review":
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Editor />
            <Compare />
            <RewritePanel />
          </div>
          <div className="space-y-4">
            <RiskScoreCard />
            <Findings />
            <Workflow />
          </div>
        </div>
      );
    case "queue":
      return <Queue />;
    case "analytics":
      return <Analytics />;
    case "kit":
      return <BrandKit />;
    case "trust":
      return <Trust />;
    default:
      return assertNever(tab, "Unknown tab");
  }
}

const TABS: Tab[] = ["review", "queue", "analytics", "kit", "trust"];
const ROLES: Role[] = ["creator", "manager", "reviewer"];

export function Workspace() {
  const { session, setTab, setRole, state, current, showLanding } = useStore();
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <button type="button" className="text-left" onClick={showLanding}>
              <h1 className="font-display text-2xl text-navy">BrandGuard</h1>
            </button>
            <p className="text-sm text-slate-500">
              Check content against approved brand sources before it goes live.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Signed in as</span>
            <select
              aria-label="Role"
              className="rounded-lg border border-navy/15 bg-paper px-3 py-2"
              value={session.role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {USERS[role].name} ({USERS[role].title})
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                session.tab === tab ? "bg-navy text-white" : "text-slate-600 hover:bg-navy/5"
              }`}
              onClick={() => setTab(tab)}
            >
              {tab === "queue" ? `Queue (${state.docs.length})` : tabLabel(tab)}
            </button>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-3">
        <p className="rounded-xl bg-navy px-4 py-3 text-sm text-white">
          Demo path: as Creator, run a check on <b>{current.title || "a sample"}</b>, apply
          safe fixes, then Rewrite in brand voice and Accept. Watch Ship / Hold / Block.
          Submit. Switch to Meera to request changes. Switch to Ravi to approve — use
          Draft override if high issues remain.
        </p>
      </div>
      <main className="mx-auto max-w-6xl px-4 pb-12">{renderTab(session.tab)}</main>
    </div>
  );
}

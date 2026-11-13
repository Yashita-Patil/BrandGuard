"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SAMPLE_MESSY, USERS } from "./brand";
import {
  applyReplacements,
  isSafeFix,
  openFindings,
  scanDoc,
} from "./engine";
import { blankDoc, seedState } from "./seed";
import { assertNever } from "./types";
import type {
  AppSession,
  BrandState,
  ContentDoc,
  HistoryAction,
  RewriteProposal,
  Role,
  Severity,
  Tab,
} from "./types";

const STATE_KEY = "brandguard-r3-state";
const SESSION_KEY = "brandguard-r3-session";

const defaultSession: AppSession = {
  role: "creator",
  tab: "review",
  currentId: "doc-sample-draft",
  severityFilter: "all",
  onboarded: false,
};

function loadState(): BrandState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as BrandState;
    if (parsed?.version === 3 && Array.isArray(parsed.docs)) return parsed;
  } catch {
    /* fall through */
  }
  return seedState();
}

function loadSession(): AppSession {
  if (typeof window === "undefined") return defaultSession;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return defaultSession;
    return { ...defaultSession, ...(JSON.parse(raw) as AppSession) };
  } catch {
    return defaultSession;
  }
}

function persistState(state: BrandState): void {
  const copy: BrandState = JSON.parse(JSON.stringify(state));
  for (const doc of copy.docs) {
    if (doc.img.startsWith("data:")) doc.img = "";
  }
  localStorage.setItem(STATE_KEY, JSON.stringify(copy));
}

interface StoreValue {
  state: BrandState;
  session: AppSession;
  current: ContentDoc;
  me: { name: string; role: Role };
  setRole: (role: Role) => void;
  setTab: (tab: Tab) => void;
  setSeverityFilter: (filter: "all" | Severity) => void;
  startDemo: (role: Role) => void;
  showLanding: () => void;
  updateCurrent: (patch: Partial<ContentDoc>) => void;
  newDraft: () => void;
  loadSample: () => void;
  runScan: () => void;
  saveDraft: () => boolean;
  applyGroup: (ruleId: string) => void;
  dismissGroup: (ruleId: string) => void;
  applyAllSafe: () => void;
  submit: () => void;
  requestChanges: (note: string) => void;
  approve: (note: string, overrideReason?: string) => void;
  addComment: (text: string) => void;
  openDoc: (id: string) => void;
  restore: (index: number) => void;
  addTerm: (avoid: string, prefer: string, why: string) => void;
  deleteRule: (id: string) => void;
  resetDemo: () => void;
  setImage: (dataUrl: string) => void;
  pendingRewrite: RewriteProposal | null;
  setPendingRewrite: (proposal: RewriteProposal | null) => void;
  acceptRewrite: () => void;
  discardRewrite: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function stamp(
  doc: ContentDoc,
  role: Role,
  action: HistoryAction,
  what: string,
): ContentDoc {
  const entry = {
    t: Date.now(),
    who: USERS[role].name,
    role,
    action,
    what,
    text: doc.text,
    alt: doc.alt,
    fg: doc.fg,
    bg: doc.bg,
  };
  return { ...doc, history: [entry, ...doc.history] };
}

function upsertDoc(docs: ContentDoc[], doc: ContentDoc): ContentDoc[] {
  const idx = docs.findIndex((item) => item.id === doc.id);
  if (idx === -1) return [doc, ...docs];
  const next = [...docs];
  next[idx] = doc;
  return next;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BrandState>(seedState);
  const [session, setSession] = useState<AppSession>(defaultSession);
  const [hydrated, setHydrated] = useState(false);
  const [pendingRewrite, setPendingRewriteState] = useState<RewriteProposal | null>(null);

  useEffect(() => {
    setState(loadState());
    setSession(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session, hydrated]);

  const me = USERS[session.role];
  const current = useMemo(() => {
    if (session.currentId) {
      const found = state.docs.find((doc) => doc.id === session.currentId);
      if (found) return found;
    }
    return blankDoc(me.name, session.role);
  }, [state.docs, session.currentId, me.name, session.role]);

  const setRole = useCallback((role: Role) => {
    setSession((prev) => ({ ...prev, role }));
  }, []);

  const setTab = useCallback((tab: Tab) => {
    setSession((prev) => ({ ...prev, tab }));
  }, []);

  const setSeverityFilter = useCallback((severityFilter: "all" | Severity) => {
    setSession((prev) => ({ ...prev, severityFilter }));
  }, []);

  const showLanding = useCallback(() => {
    setSession((prev) => ({ ...prev, onboarded: false }));
  }, []);

  const startDemo = useCallback((role: Role) => {
    let currentId: string;
    switch (role) {
      case "creator":
        currentId = "doc-sample-draft";
        break;
      case "reviewer":
        currentId = "doc-launch";
        break;
      case "manager":
        currentId = "doc-spring";
        break;
      default:
        currentId = assertNever(role, "Unknown role");
    }
    setSession((prev) => ({
      ...prev,
      role,
      onboarded: true,
      tab: "review",
      currentId,
    }));
  }, []);

  const commit = useCallback(
    (doc: ContentDoc, currentId = doc.id || session.currentId) => {
      setState((prev) => ({ ...prev, docs: upsertDoc(prev.docs, doc) }));
      if (currentId) setSession((prev) => ({ ...prev, currentId }));
    },
    [session.currentId],
  );

  const updateCurrent = useCallback(
    (patch: Partial<ContentDoc>) => {
      const base = current.id
        ? current
        : { ...current, id: `D${Date.now().toString(36)}`, author: me.name, authorRole: session.role };
      const next = { ...base, ...patch };
      if (!current.id && !session.currentId) {
        commit(next, next.id);
        return;
      }
      if (!current.id) {
        commit(next, next.id);
        return;
      }
      commit(next);
    },
    [commit, current, me.name, session.role, session.currentId],
  );

  const newDraft = useCallback(() => {
    const draft: ContentDoc = {
      ...blankDoc(me.name, session.role),
      id: `D${Date.now().toString(36)}`,
    };
    const stamped = stamp(draft, session.role, "created", "Created a new draft");
    commit(stamped, stamped.id);
    setPendingRewriteState(null);
    setSession((prev) => ({ ...prev, currentId: stamped.id, tab: "review" }));
  }, [commit, me.name, session.role]);

  const loadSample = useCallback(() => {
    const draft: ContentDoc = {
      ...blankDoc(me.name, session.role),
      id: `D${Date.now().toString(36)}`,
      title: SAMPLE_MESSY.title,
      type: SAMPLE_MESSY.type,
      text: SAMPLE_MESSY.text,
      alt: SAMPLE_MESSY.alt,
      fg: SAMPLE_MESSY.fg,
      bg: SAMPLE_MESSY.bg,
      hasImg: true,
      img: SAMPLE_MESSY.img,
      originalText: SAMPLE_MESSY.text,
      originalAlt: SAMPLE_MESSY.alt,
      originalFg: SAMPLE_MESSY.fg,
      originalBg: SAMPLE_MESSY.bg,
    };
    const findings = scanDoc(draft, state.rules, state.facts);
    const stamped = stamp(
      { ...draft, lastFindings: findings },
      session.role,
      "created",
      "Loaded sample with known issues",
    );
    commit(stamped, stamped.id);
    setPendingRewriteState(null);
    setSession((prev) => ({ ...prev, tab: "review" }));
  }, [commit, me.name, session.role, state.facts, state.rules]);

  const runScan = useCallback(() => {
    const findings = scanDoc(current, state.rules, state.facts);
    let next = { ...current, lastFindings: findings };
    if (!next.originalText && next.text) {
      next = {
        ...next,
        originalText: next.text,
        originalAlt: next.alt,
        originalFg: next.fg,
        originalBg: next.bg,
      };
    }
    next = stamp(next, session.role, "scanned", `Ran brand check (${findings.length} unique findings)`);
    if (!next.id) {
      next = { ...next, id: `D${Date.now().toString(36)}` };
    }
    commit(next, next.id);
  }, [commit, current, session.role, state.facts, state.rules]);

  const saveDraft = useCallback(() => {
    if (!current.title.trim()) return false;
    let next = current;
    if (!next.id) next = { ...next, id: `D${Date.now().toString(36)}` };
    next = stamp(next, session.role, "saved", "Saved draft");
    commit(next, next.id);
    return true;
  }, [commit, current, session.role]);

  const applyGroup = useCallback(
    (ruleId: string) => {
      const open = openFindings(current.lastFindings, current.dismissed);
      const group = open.filter((finding) => finding.ruleId === ruleId && finding.fix);
      if (!group.length) return;
      const replacements = group.map((finding) => ({
        match: finding.match,
        fix: finding.fix as string,
      }));
      const text = applyReplacements(current.text, replacements);
      const applied = group.map((finding) => ({
        t: Date.now(),
        match: finding.match,
        fix: finding.fix as string,
        ruleId: finding.ruleId,
      }));
      let next: ContentDoc = {
        ...current,
        text,
        appliedFixes: [...applied, ...current.appliedFixes],
      };
      next.lastFindings = scanDoc(next, state.rules, state.facts);
      next = stamp(
        next,
        session.role,
        "applied_fix",
        `Applied ${applied.length} safe replacement(s) for ${ruleId}`,
      );
      commit(next);
    },
    [commit, current, session.role, state.facts, state.rules],
  );

  const dismissGroup = useCallback(
    (ruleId: string) => {
      const open = openFindings(current.lastFindings, current.dismissed);
      const group = open.filter((finding) => finding.ruleId === ruleId);
      const dismissed = { ...current.dismissed };
      for (const finding of group) dismissed[finding.key] = true;
      let next: ContentDoc = { ...current, dismissed };
      next = stamp(
        next,
        session.role,
        "dismissed",
        `Dismissed ${group.length} grouped finding(s) for ${ruleId}`,
      );
      commit(next);
    },
    [commit, current, session.role],
  );

  const applyAllSafe = useCallback(() => {
    const open = openFindings(current.lastFindings, current.dismissed).filter(isSafeFix);
    if (!open.length) return;
    const replacements = open.map((finding) => ({
      match: finding.match,
      fix: finding.fix as string,
    }));
    const text = applyReplacements(current.text, replacements);
    const applied = open.map((finding) => ({
      t: Date.now(),
      match: finding.match,
      fix: finding.fix as string,
      ruleId: finding.ruleId,
    }));
    let next: ContentDoc = {
      ...current,
      text,
      appliedFixes: [...applied, ...current.appliedFixes],
    };
    next.lastFindings = scanDoc(next, state.rules, state.facts);
    next = stamp(
      next,
      session.role,
      "applied_all_safe",
      `Applied all ${applied.length} safe fixes`,
    );
    commit(next);
  }, [commit, current, session.role, state.facts, state.rules]);

  const submit = useCallback(() => {
    if (!current.text.trim()) return;
    const findings = scanDoc(current, state.rules, state.facts);
    let next: ContentDoc = {
      ...current,
      lastFindings: findings,
      status: "in_review",
      submitCount: current.submitCount + 1,
      revision: current.revision + 1,
      submittedAt: Date.now(),
    };
    if (!next.id) next = { ...next, id: `D${Date.now().toString(36)}`, author: me.name, authorRole: session.role };
    const resubmit = current.submitCount > 0;
    if (resubmit) {
      next.comments = [
        {
          t: Date.now(),
          who: me.name,
          role: session.role,
          text: `Resubmitted revision ${next.revision} for review.`,
          kind: "resubmit",
        },
        ...next.comments,
      ];
    }
    next = stamp(
      next,
      session.role,
      resubmit ? "resubmitted" : "submitted",
      `${resubmit ? "Resubmitted" : "Submitted"} revision ${next.revision} with ${openFindings(findings, next.dismissed).length} open finding(s)`,
    );
    commit(next, next.id);
  }, [commit, current, me.name, session.role, state.facts, state.rules]);

  const requestChanges = useCallback(
    (note: string) => {
      const trimmed = note.trim();
      if (!trimmed) return;
      let next: ContentDoc = {
        ...current,
        status: "changes_requested",
        reviewer: me.name,
        reviewerRole: session.role,
        reviewedAt: Date.now(),
        comments: [
          {
            t: Date.now(),
            who: me.name,
            role: session.role,
            text: trimmed,
            kind: "change_request",
          },
          ...current.comments,
        ],
        decisions: [
          {
            t: Date.now(),
            who: me.name,
            role: session.role,
            outcome: "changes_requested",
            note: trimmed,
            override: false,
            openHighCount: openFindings(current.lastFindings, current.dismissed).filter(
              (finding) => finding.sev === "high",
            ).length,
          },
          ...current.decisions,
        ],
      };
      next = stamp(next, session.role, "requested_changes", `Requested changes: ${trimmed}`);
      commit(next);
    },
    [commit, current, me.name, session.role],
  );

  const approve = useCallback(
    (note: string, overrideReason?: string) => {
      const high = openFindings(current.lastFindings, current.dismissed).filter(
        (finding) => finding.sev === "high",
      );
      if (high.length && !overrideReason?.trim()) return;
      const trimmed = (overrideReason || note).trim();
      let next: ContentDoc = {
        ...current,
        status: "approved",
        reviewer: current.reviewer ?? me.name,
        reviewerRole: current.reviewerRole ?? session.role,
        approver: me.name,
        approverRole: session.role,
        reviewedAt: Date.now(),
        approvedAt: Date.now(),
        comments: [
          {
            t: Date.now(),
            who: me.name,
            role: session.role,
            text: trimmed || "Approved.",
            kind: high.length ? "override" : "approval",
          },
          ...current.comments,
        ],
        decisions: [
          {
            t: Date.now(),
            who: me.name,
            role: session.role,
            outcome: "approved",
            note: trimmed || "Approved.",
            override: high.length > 0,
            openHighCount: high.length,
          },
          ...current.decisions,
        ],
      };
      next = stamp(
        next,
        session.role,
        high.length ? "override_approved" : "approved",
        high.length
          ? `Approved with override (${high.length} high-severity open): ${trimmed}`
          : `Approved: ${trimmed || "no open high-severity findings"}`,
      );
      commit(next);
    },
    [commit, current, me.name, session.role],
  );

  const addComment = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      let next: ContentDoc = {
        ...current,
        comments: [
          {
            t: Date.now(),
            who: me.name,
            role: session.role,
            text: trimmed,
            kind: "comment",
          },
          ...current.comments,
        ],
      };
      next = stamp(next, session.role, "commented", trimmed);
      commit(next);
    },
    [commit, current, me.name, session.role],
  );

  const openDoc = useCallback(
    (id: string) => {
      const found = state.docs.find((doc) => doc.id === id);
      if (!found) return;
      const lastFindings = scanDoc(found, state.rules, state.facts);
      setState((prev) => ({
        ...prev,
        docs: upsertDoc(prev.docs, { ...found, lastFindings }),
      }));
      setPendingRewriteState(null);
      setSession((prev) => ({ ...prev, currentId: id, tab: "review" }));
    },
    [state.docs, state.facts, state.rules],
  );

  const restore = useCallback(
    (index: number) => {
      const entry = current.history[index];
      if (!entry) return;
      let next: ContentDoc = {
        ...current,
        text: entry.text,
        alt: entry.alt,
        fg: entry.fg,
        bg: entry.bg,
      };
      next.lastFindings = scanDoc(next, state.rules, state.facts);
      next = stamp(next, session.role, "restored", `Restored version from ${new Date(entry.t).toLocaleString()}`);
      commit(next);
    },
    [commit, current, session.role, state.facts, state.rules],
  );

  const addTerm = useCallback((avoid: string, prefer: string, why: string) => {
    const a = avoid.trim();
    const p = prefer.trim();
    if (!a || !p) return;
    setState((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          id: `u${Date.now().toString(36)}`,
          cat: "Terminology",
          sev: "medium",
          re: `\\b${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          fix: p,
          why: why.trim() || `Preferred wording is ‘${p}’.`,
          src: `Custom rule added by ${me.name}`,
          custom: true,
        },
      ],
    }));
  }, [me.name]);

  const deleteRule = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      rules: prev.rules.filter((rule) => rule.id !== id),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(SESSION_KEY);
    setState(seedState());
    setSession(defaultSession);
  }, []);

  const setImage = useCallback(
    (dataUrl: string) => {
      commit({ ...current, img: dataUrl, hasImg: true, id: current.id || `D${Date.now().toString(36)}` });
    },
    [commit, current],
  );

  const setPendingRewrite = useCallback(
    (proposal: RewriteProposal | null) => {
      setPendingRewriteState(proposal);
      if (proposal && current.id) {
        commit(
          stamp(
            current,
            session.role,
            "proposed_rewrite",
            `Proposed a ${proposal.source} brand rewrite (${proposal.changes.length} change(s); engine still reports ${proposal.remainingOpen} open)`,
          ),
        );
      }
    },
    [commit, current, session.role],
  );

  const acceptRewrite = useCallback(() => {
    if (!pendingRewrite) return;
    let next: ContentDoc = {
      ...current,
      text: pendingRewrite.afterText,
      alt: pendingRewrite.afterAlt,
      fg: pendingRewrite.afterFg,
      bg: pendingRewrite.afterBg,
    };
    next.lastFindings = scanDoc(next, state.rules, state.facts);
    next = stamp(
      next,
      session.role,
      "accepted_rewrite",
      `Accepted ${pendingRewrite.source} rewrite; engine now reports ${openFindings(next.lastFindings, next.dismissed).length} open finding(s)`,
    );
    commit(next);
    setPendingRewriteState(null);
  }, [commit, current, pendingRewrite, session.role, state.facts, state.rules]);

  const discardRewrite = useCallback(() => {
    if (current.id) {
      commit(stamp(current, session.role, "discarded_rewrite", "Discarded rewrite proposal"));
    }
    setPendingRewriteState(null);
  }, [commit, current, session.role]);

  const value: StoreValue = {
    state,
    session,
    current,
    me: { name: me.name, role: session.role },
    setRole,
    setTab,
    setSeverityFilter,
    startDemo,
    showLanding,
    updateCurrent,
    newDraft,
    loadSample,
    runScan,
    saveDraft,
    applyGroup,
    dismissGroup,
    applyAllSafe,
    submit,
    requestChanges,
    approve,
    addComment,
    openDoc,
    restore,
    addTerm,
    deleteRule,
    resetDemo,
    setImage,
    pendingRewrite,
    setPendingRewrite,
    acceptRewrite,
    discardRewrite,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

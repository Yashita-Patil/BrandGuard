import { findingLabel } from "./engine";
import type { ContentDoc, Fact, Finding, Rule } from "./types";

export interface CategoryStat {
  cat: string;
  count: number;
}

export interface IssueStat {
  ruleId: string;
  label: string;
  cat: string;
  count: number;
  docs: number;
}

export interface AnalyticsSnapshot {
  totalDocs: number;
  totalReviewed: number;
  approved: number;
  inReview: number;
  changesRequested: number;
  drafts: number;
  approvalRate: number;
  resubmitRate: number;
  avgOpenFindings: number;
  categories: CategoryStat[];
  frequentIssues: IssueStat[];
  byType: { type: string; reviewed: number; approved: number }[];
  recentDecisions: {
    title: string;
    who: string;
    outcome: string;
    note: string;
    t: number;
  }[];
}

function reviewedDocs(docs: ContentDoc[]): ContentDoc[] {
  return docs.filter((doc) => doc.submitCount > 0);
}

function lastScanFindings(doc: ContentDoc): Finding[] {
  return doc.lastFindings ?? [];
}

export function computeAnalytics(
  docs: ContentDoc[],
  rules: Rule[],
  facts: Fact[],
): AnalyticsSnapshot {
  const reviewed = reviewedDocs(docs);
  const approved = docs.filter((doc) => doc.status === "approved").length;
  const inReview = docs.filter((doc) => doc.status === "in_review").length;
  const changesRequested = docs.filter(
    (doc) => doc.status === "changes_requested",
  ).length;
  const drafts = docs.filter((doc) => doc.status === "draft").length;
  const resubmitted = reviewed.filter((doc) => doc.submitCount > 1).length;

  const catMap = new Map<string, number>();
  const issueMap = new Map<
    string,
    { count: number; docs: Set<string>; cat: string }
  >();

  let openTotal = 0;
  for (const doc of reviewed) {
    const findings = lastScanFindings(doc).filter(
      (finding) => !doc.dismissed[finding.key],
    );
    openTotal += findings.length;
    for (const finding of findings) {
      catMap.set(finding.cat, (catMap.get(finding.cat) ?? 0) + finding.occurrences);
      const issue = issueMap.get(finding.ruleId) ?? {
        count: 0,
        docs: new Set<string>(),
        cat: finding.cat,
      };
      issue.count += finding.occurrences;
      issue.docs.add(doc.id);
      issueMap.set(finding.ruleId, issue);
    }
  }

  const types = [
    "Social post",
    "Email",
    "Web page",
    "Ad copy",
    "Image / design",
  ] as const;
  const byType = types.map((type) => {
    const subset = reviewed.filter((doc) => doc.type === type);
    return {
      type,
      reviewed: subset.length,
      approved: subset.filter((doc) => doc.status === "approved").length,
    };
  });

  const recentDecisions = reviewed
    .flatMap((doc) =>
      doc.decisions.map((decision) => ({
        title: doc.title,
        who: decision.who,
        outcome: decision.outcome,
        note: decision.note,
        t: decision.t,
      })),
    )
    .sort((a, b) => b.t - a.t)
    .slice(0, 8);

  return {
    totalDocs: docs.length,
    totalReviewed: reviewed.length,
    approved,
    inReview,
    changesRequested,
    drafts,
    approvalRate: reviewed.length ? approved / reviewed.length : 0,
    resubmitRate: reviewed.length ? resubmitted / reviewed.length : 0,
    avgOpenFindings: reviewed.length ? openTotal / reviewed.length : 0,
    categories: [...catMap.entries()]
      .map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => b.count - a.count),
    frequentIssues: [...issueMap.entries()]
      .map(([ruleId, value]) => ({
        ruleId,
        label: findingLabel(ruleId, rules, facts),
        cat: value.cat,
        count: value.count,
        docs: value.docs.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    byType,
    recentDecisions,
  };
}

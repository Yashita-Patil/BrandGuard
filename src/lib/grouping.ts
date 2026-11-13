import { findingLabel } from "./engine";
import type { Fact, Finding, FindingGroup, Rule, Severity } from "./types";

const SEV_RANK: Record<Severity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function worse(a: Severity, b: Severity): Severity {
  return SEV_RANK[a] >= SEV_RANK[b] ? a : b;
}

export function groupFindings(
  findings: Finding[],
  rules: Rule[],
  facts: Fact[],
): FindingGroup[] {
  const map = new Map<string, FindingGroup>();
  for (const finding of findings) {
    const existing = map.get(finding.ruleId);
    if (existing) {
      existing.findings.push(finding);
      existing.count += finding.occurrences;
      existing.uniqueMatches += 1;
      existing.sev = worse(existing.sev, finding.sev);
      existing.hasSafeFix = existing.hasSafeFix || Boolean(finding.fix);
      continue;
    }
    map.set(finding.ruleId, {
      ruleId: finding.ruleId,
      cat: finding.cat,
      sev: finding.sev,
      why: finding.why,
      src: finding.src,
      hint: finding.hint,
      label: findingLabel(finding.ruleId, rules, facts),
      count: finding.occurrences,
      uniqueMatches: 1,
      findings: [finding],
      hasSafeFix: Boolean(finding.fix),
    });
  }
  return [...map.values()].sort(
    (a, b) => SEV_RANK[b.sev] - SEV_RANK[a.sev] || b.count - a.count,
  );
}

export function filterGroups(
  groups: FindingGroup[],
  severity: "all" | Severity,
): FindingGroup[] {
  if (severity === "all") return groups;
  return groups.filter((group) => group.sev === severity);
}

export function safeFixCount(groups: FindingGroup[]): number {
  return groups.reduce((sum, group) => {
    if (!group.hasSafeFix) return sum;
    return (
      sum +
      group.findings.filter((finding) => finding.fix).reduce((n, f) => n + f.occurrences, 0)
    );
  }, 0);
}

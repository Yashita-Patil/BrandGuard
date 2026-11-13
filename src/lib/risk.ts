import { findingLabel, openFindings } from "./engine";
import { assertNever } from "./types";
import type { ContentDoc, Fact, Finding, RiskLevel, RiskScore, Rule, Severity } from "./types";

function businessRiskForRule(ruleId: string, cat: string): string {
  switch (ruleId) {
    case "c1":
      return "Unsupported ranking claims can trigger advertising complaints and forced takedowns.";
    case "c2":
      return "Absolute guarantees create legal exposure if a member cannot actually get that promise.";
    case "t3":
      return "Wrong brand spelling fragments search, trademarks, and partner recognition.";
    case "f1":
    case "f2":
    case "f3":
    case "f4":
      return "A published fact that disagrees with the approved sheet becomes a trust and support incident.";
    case "a11y-contrast":
      return "Low contrast fails WCAG and excludes members with low vision — a ship blocker.";
    case "a11y-alt":
      return "Missing or weak alt text fails accessibility review and can stall campaign legal sign-off.";
    case "a11y-link":
      return "Vague link text fails accessibility checks and looks careless in partner reviews.";
    case "a11y-long":
      return "Overlong sentences reduce comprehension and raise bounce on landing pages.";
    case "m1":
      return "Hype words clash with Northwind’s calm voice and read as unsubstantiated marketing.";
    case "m2":
      return "Stacked punctuation looks shouty and off-brand in paid placements.";
    case "m3":
      return "All-caps reads as shouting and weakens a premium voice.";
    case "t1":
    case "t2":
    case "t4":
      return "Off-list wording makes Northwind sound generic or discount, not premium.";
    case "vis-palette":
      return "Off-palette colour breaks visual identity across channels.";
    default:
      break;
  }
  switch (cat) {
    case "Claims":
      return "Unapproved claims can be challenged after the piece is live.";
    case "Facts":
      return "Incorrect facts will be quoted back by members and press.";
    case "Terminology":
      return "Inconsistent terms dilute the brand voice.";
    case "Tone":
      return "Tone mismatches make the brand feel unreliable.";
    case "Accessibility":
      return "Accessibility gaps can block publication in regulated channels.";
    case "Visual":
      return "Visual drift makes campaigns look unofficial.";
    default:
      return "Open guideline miss — confirm against the Brand Kit before shipping.";
  }
}

export function riskLevel(high: number, medium: number): RiskLevel {
  if (high > 0) return "block";
  if (medium > 0) return "hold";
  return "ship";
}

export function riskLabel(level: RiskLevel): string {
  switch (level) {
    case "ship":
      return "Ship";
    case "hold":
      return "Hold";
    case "block":
      return "Block";
    default:
      return assertNever(level, "Unknown risk level");
  }
}

export function riskSummary(level: RiskLevel, high: number, medium: number, low: number): string {
  switch (level) {
    case "block":
      return `${high} high-severity issue${high === 1 ? "" : "s"} still open. Do not publish without a logged override.`;
    case "hold":
      return `${medium} medium-severity issue${medium === 1 ? "" : "s"} remain (${low} low). Hold for a creator pass or a reviewer comment.`;
    case "ship":
      return low
        ? `No high or medium issues. ${low} low-severity note${low === 1 ? "" : "s"} — safe to ship if the reviewer agrees.`
        : "No open findings. The rule engine is clear to ship.";
    default:
      return assertNever(level, "Unknown risk summary");
  }
}

function countSev(findings: Finding[], sev: Severity): number {
  return findings.filter((finding) => finding.sev === sev).length;
}

export function scoreRisk(
  doc: ContentDoc,
  rules: Rule[],
  facts: Fact[],
): RiskScore {
  const open = openFindings(doc.lastFindings, doc.dismissed);
  const high = countSev(open, "high");
  const medium = countSev(open, "medium");
  const low = countSev(open, "low");
  const level = riskLevel(high, medium);
  return {
    level,
    summary: riskSummary(level, high, medium, low),
    high,
    medium,
    low,
    evidence: open.map((finding) => ({
      ruleId: finding.ruleId,
      label: findingLabel(finding.ruleId, rules, facts),
      sev: finding.sev,
      src: finding.src,
      match: finding.match,
      businessRisk: businessRiskForRule(finding.ruleId, finding.cat),
    })),
  };
}

export function draftOverrideJustification(score: RiskScore, title: string): string {
  const highs = score.evidence.filter((item) => item.sev === "high");
  const lines = highs.map(
    (item) => `• ${item.label} (“${item.match}”, ${item.src}) — ${item.businessRisk}`,
  );
  return [
    `Override for “${title || "untitled"}”: the rule engine still flags ${score.high} high-severity issue(s), so the default recommendation is Block.`,
    lines.join("\n") || "• High-severity findings are open against the Brand Kit.",
    "I am approving anyway because this placement is time-bound and the residual risk is accepted by brand for this revision only.",
    "Follow-up: correct the cited issues in the next revision and do not reuse this copy in evergreen channels.",
  ].join("\n\n");
}

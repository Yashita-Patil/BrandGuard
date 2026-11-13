import type { Fact, Finding, Rule } from "./types";

export function kitBrief(rules: Rule[], facts: Fact[]): string {
  const terms = rules
    .map((rule) => `- [${rule.cat}/${rule.sev}] ${rule.why} Source: ${rule.src}${rule.fix ? ` Prefer: ${rule.fix}` : rule.hint ? ` Hint: ${rule.hint}` : ""}`)
    .join("\n");
  const approved = facts.map((fact) => `- ${fact.label} (${fact.src})`).join("\n");
  return `Northwind Brand Kit
Voice: confident, calm, never hype. Call people members. Brand name is always “Northwind”.
Approved facts:
${approved}
Rules:
${terms}
Palette: #0B3D91, #FFFFFF, #F4B400, #1A1A1A, #E8EEF9
Do not invent proof points. Only use facts listed above. Superlatives need evidence; guarantees must become 30-day returns.`;
}

export function findingsBrief(findings: Finding[]): string {
  if (!findings.length) return "No open findings.";
  return findings
    .map(
      (finding) =>
        `- ${finding.sev} ${finding.cat} “${finding.match}” (${finding.src}): ${finding.why}${finding.hint ? ` Hint: ${finding.hint}` : ""}`,
    )
    .join("\n");
}

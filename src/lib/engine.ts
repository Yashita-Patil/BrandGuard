import { BUILTIN, PALETTE } from "./brand";
import type { ContentDoc, Finding, Fact, Rule, Severity } from "./types";

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function isHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}

function pushFinding(
  list: Finding[],
  seen: Map<string, Finding>,
  finding: Omit<Finding, "key" | "occurrences">,
): void {
  const key = `${finding.ruleId}|${finding.match.toLowerCase()}`;
  const existing = seen.get(key);
  if (existing) {
    existing.occurrences += 1;
    return;
  }
  const full: Finding = { ...finding, key, occurrences: 1 };
  seen.set(key, full);
  list.push(full);
}

export interface ScanInput {
  text: string;
  alt: string;
  fg: string;
  bg: string;
  hasImg: boolean;
}

export function scanContent(
  content: ScanInput,
  rules: Rule[],
  facts: Fact[],
): Finding[] {
  const findings: Finding[] = [];
  const seen = new Map<string, Finding>();

  const add = (finding: Omit<Finding, "key" | "occurrences">) => {
    pushFinding(findings, seen, finding);
  };

  for (const rule of rules) {
    let re: RegExp;
    try {
      // Brand-name variants are case-sensitive so the approved spelling “Northwind” is not flagged.
      re = new RegExp(rule.re, rule.id === "t3" ? "g" : "gi");
    } catch {
      continue;
    }
    for (const match of content.text.matchAll(re)) {
      const token = match[0];
      if (rule.id === "m3" && !/[A-Z]{4,}/.test(token)) continue;
      add({
        ruleId: rule.id,
        cat: rule.cat,
        sev: rule.sev,
        match: token,
        fix: rule.fix ?? null,
        hint: rule.hint,
        why: rule.why,
        src: rule.src,
      });
    }
  }

  for (const fact of facts) {
    const re = new RegExp(fact.re, "gi");
    for (const match of content.text.matchAll(re)) {
      const captured = (match[1] ?? "").replace(/,/g, "");
      if (captured === fact.val) continue;
      add({
        ruleId: fact.id,
        cat: "Facts",
        sev: "high",
        match: match[0],
        fix: match[0].replace(match[1], fact.val),
        why: `Content says ${match[1]}, but the approved fact is “${fact.label}”.`,
        src: fact.src,
      });
    }
  }

  const builtin = (
    id: keyof typeof BUILTIN,
    sev: Severity,
    match: string,
    why: string,
    hint: string,
    src: string,
  ) => {
    add({
      ruleId: id,
      cat: BUILTIN[id][0],
      sev,
      match,
      fix: null,
      hint,
      why,
      src,
    });
  };

  const alt = content.alt.trim();
  if (content.hasImg && !alt) {
    builtin(
      "a11y-alt",
      "high",
      "(image)",
      "This image has no alt text, so screen-reader users miss it.",
      "Describe what the image shows and why it matters, in one sentence.",
      "Accessibility Standard §2 – WCAG 1.1.1",
    );
  } else if (alt && (alt.length < 8 || /^(image|picture|photo) of/i.test(alt))) {
    builtin(
      "a11y-alt",
      "medium",
      alt,
      "Alt text is too short or starts with ‘image of’.",
      "Describe the content directly, e.g. ‘Northwind Pro laptop open on a desk’.",
      "Accessibility Standard §2 – WCAG 1.1.1",
    );
  }

  for (const match of content.text.matchAll(
    /\b(click here|read more here|here)\b(?=[^.]*link|\s*$)|click here/gi,
  )) {
    builtin(
      "a11y-link",
      "medium",
      match[0],
      "Link text should make sense out of context.",
      "Use descriptive text such as ‘view pricing details’.",
      "Accessibility Standard §4 – WCAG 2.4.4",
    );
  }

  for (const sentence of content.text.split(/(?<=[.!?])\s+/)) {
    if (sentence.trim().split(/\s+/).length > 30) {
      builtin(
        "a11y-long",
        "low",
        `${sentence.trim().slice(0, 50)}…`,
        "Sentence has over 30 words, which is hard to read.",
        "Split it into two shorter sentences.",
        "Accessibility Standard §5 – Readability",
      );
    }
  }

  if (isHex(content.fg) && isHex(content.bg)) {
    const a = luminance(content.fg);
    const b = luminance(content.bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 4.5) {
      builtin(
        "a11y-contrast",
        "high",
        `${content.fg} on ${content.bg}`,
        `Contrast ratio is ${ratio.toFixed(1)}:1; text needs at least 4.5:1.`,
        "Use Northwind blue #0B3D91 on white (about 10:1).",
        "Accessibility Standard §3 – WCAG 1.4.3",
      );
    }
  }

  for (const color of [content.fg, content.bg]) {
    if (
      isHex(color) &&
      !PALETTE.includes(color.toUpperCase() as (typeof PALETTE)[number])
    ) {
      builtin(
        "vis-palette",
        "medium",
        color,
        `${color} is not in the approved palette (${PALETTE.join(", ")}).`,
        "Swap to the nearest approved colour.",
        "Visual Identity §2 – Colour palette",
      );
    }
  }

  return findings;
}

export function scanDoc(doc: ContentDoc, rules: Rule[], facts: Fact[]): Finding[] {
  return scanContent(doc, rules, facts);
}

export function openFindings(
  findings: Finding[],
  dismissed: Record<string, boolean>,
): Finding[] {
  return findings.filter((finding) => !dismissed[finding.key]);
}

export function isSafeFix(finding: Finding): boolean {
  return Boolean(finding.fix);
}

export function applyReplacements(
  text: string,
  replacements: { match: string; fix: string }[],
): string {
  const ordered = [...replacements].sort((a, b) => b.match.length - a.match.length);
  let next = text;
  for (const item of ordered) {
    if (!item.fix) continue;
    next = next.split(item.match).join(item.fix);
  }
  return next;
}

export function findingLabel(
  ruleId: string,
  rules: Rule[],
  facts: Fact[],
): string {
  if (BUILTIN[ruleId]) return BUILTIN[ruleId][1];
  const rule = rules.find((item) => item.id === ruleId);
  if (rule) return rule.why;
  const fact = facts.find((item) => item.id === ruleId);
  if (fact) return fact.label;
  return ruleId;
}

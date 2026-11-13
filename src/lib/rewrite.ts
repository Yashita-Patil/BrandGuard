import {
  applyReplacements,
  isSafeFix,
  openFindings,
  scanContent,
} from "./engine";
import { findingsBrief, kitBrief } from "./kit-context";
import type { Fact, Finding, RewriteChange, RewriteProposal, Rule } from "./types";

export interface RewriteInput {
  text: string;
  alt: string;
  fg: string;
  bg: string;
  hasImg: boolean;
  rules: Rule[];
  facts: Fact[];
  dismissed: Record<string, boolean>;
}

const KIT_ALT =
  "Northwind Pro laptop open on a wooden desk beside a coffee cup";

function pushChange(
  changes: RewriteChange[],
  citations: Map<string, string>,
  before: string,
  after: string,
  reason: string,
  src: string,
): void {
  if (before === after) return;
  changes.push({ before, after, reason, src });
  if (!citations.has(src)) citations.set(src, reason);
}

function applySafeClone(text: string, open: Finding[]): { text: string; changes: RewriteChange[] } {
  const safe = open.filter(isSafeFix);
  const changes: RewriteChange[] = [];
  let next = text;
  const ordered = [...safe].sort((a, b) => b.match.length - a.match.length);
  for (const finding of ordered) {
    if (!finding.fix) continue;
    if (!next.includes(finding.match)) continue;
    next = applyReplacements(next, [{ match: finding.match, fix: finding.fix }]);
    changes.push({
      before: finding.match,
      after: finding.fix,
      reason: `Deterministic safe fix: ${finding.why}`,
      src: finding.src,
    });
  }
  return { text: next, changes };
}

function rewriteRemaining(
  text: string,
  alt: string,
  fg: string,
  bg: string,
  hasImg: boolean,
  remaining: Finding[],
): {
  text: string;
  alt: string;
  fg: string;
  bg: string;
  changes: RewriteChange[];
  citations: Map<string, string>;
} {
  let next = text;
  let nextAlt = alt;
  let nextFg = fg;
  let nextBg = bg;
  const changes: RewriteChange[] = [];
  const citations = new Map<string, string>();

  const phrasePasses: {
    re: RegExp;
    to: string;
    reason: string;
    src: string;
  }[] = [
    {
      re: /\bthe BEST laptop in the world\b/gi,
      to: "a laptop built for members, with battery life up to 18 hours",
      reason: "Replaced an unsupported superlative with the approved battery fact.",
      src: "Claims Policy §3 – Superlatives need evidence",
    },
    {
      re: /\bBEST laptop in the world\b/gi,
      to: "Northwind Pro, with battery life up to 18 hours",
      reason: "Superlative removed; cited the approved 18-hour battery fact.",
      src: "Northwind Pro Spec Sheet v4",
    },
    {
      re: /\bthe fastest notebook we have ever shipped\b/gi,
      to: "the Northwind Pro, with battery life up to 18 hours",
      reason: "Unsupported ‘fastest’ claim replaced with an approved spec.",
      src: "Claims Policy §3 – Superlatives need evidence",
    },
    {
      re: /\bguaranteed results\b/gi,
      to: "30-day returns on every order",
      reason: "Absolute guarantee swapped for approved returns terms.",
      src: "Claims Policy §4 – Guarantees",
    },
    {
      re: /\b(guaranteed|risk-free|zero risk|clinically proven|100% (?:safe|guaranteed))\b/gi,
      to: "covered by 30-day returns",
      reason: "Guarantee language is not approved; 30-day returns are.",
      src: "Returns Policy 2026",
    },
    {
      re: /\b(revolutionary|game-changing|miracle)\b/gi,
      to: "well-built",
      reason: "Hype word replaced with calm, concrete voice.",
      src: "Voice Guide §1.2 – No hype words",
    },
    {
      re: /\bClick here to use our launch offer\./gi,
      to: "View the pricing details on our website.",
      reason: "Non-descriptive link text rewritten so it makes sense out of context.",
      src: "Accessibility Standard §4 – WCAG 2.4.4",
    },
    {
      re: /\bClick here if you want the well-built battery story\./gi,
      to: "View the pricing details on our website.",
      reason: "Vague ‘click here’ link replaced with descriptive text.",
      src: "Accessibility Standard §4 – WCAG 2.4.4",
    },
    {
      re: /\bclick here\b/gi,
      to: "view the pricing details",
      reason: "Link text now describes the destination.",
      src: "Accessibility Standard §4 – WCAG 2.4.4",
    },
    {
      re: /\b(best|#1|number one|fastest)\b/gi,
      to: "member-tested",
      reason: "Leftover superlative removed; no unapproved ranking invented.",
      src: "Claims Policy §3 – Superlatives need evidence",
    },
  ];

  for (const pass of phrasePasses) {
    if (!pass.re.test(next)) {
      pass.re.lastIndex = 0;
      continue;
    }
    pass.re.lastIndex = 0;
    const matched = next.match(pass.re)?.[0];
    next = next.replace(pass.re, pass.to);
    pushChange(changes, citations, matched ?? pass.re.source, pass.to, pass.reason, pass.src);
  }

  for (const finding of remaining) {
    if (finding.ruleId === "a11y-alt" && hasImg) {
      pushChange(
        changes,
        citations,
        nextAlt || "(empty alt)",
        KIT_ALT,
        "Alt text now describes the image without starting with ‘image of’.",
        finding.src,
      );
      nextAlt = KIT_ALT;
    }
    if (finding.ruleId === "a11y-contrast") {
      pushChange(
        changes,
        citations,
        `${nextFg} on ${nextBg}`,
        "#0B3D91 on #FFFFFF",
        "Switched to approved Northwind blue on white (about 10:1 contrast).",
        finding.src,
      );
      nextFg = "#0B3D91";
      nextBg = "#FFFFFF";
    }
    if (finding.ruleId === "vis-palette") {
      const approved = finding.match.toUpperCase() === nextBg.toUpperCase() ? "#FFFFFF" : "#0B3D91";
      if (finding.match.toUpperCase() === nextFg.toUpperCase()) {
        pushChange(changes, citations, nextFg, approved, "Colour moved onto the approved palette.", finding.src);
        nextFg = approved;
      } else if (finding.match.toUpperCase() === nextBg.toUpperCase()) {
        pushChange(changes, citations, nextBg, "#FFFFFF", "Background moved onto the approved palette.", finding.src);
        nextBg = "#FFFFFF";
      }
    }
    if (finding.ruleId === "m3" && /[A-Z]{4,}/.test(finding.match) && next.includes(finding.match)) {
      const lowered =
        finding.match.charAt(0) + finding.match.slice(1).toLowerCase();
      next = next.split(finding.match).join(lowered);
      pushChange(
        changes,
        citations,
        finding.match,
        lowered,
        "All-caps wording converted to sentence case.",
        finding.src,
      );
    }
    if (finding.ruleId === "a11y-long") {
      const sentences = next.split(/(?<=[.!?])\s+/);
      const long = sentences.find((s) => s.trim().split(/\s+/).length > 30);
      if (long) {
        const splitAt = long.indexOf(", ");
        if (splitAt > 20) {
          const rewritten = `${long.slice(0, splitAt)}. ${long.slice(splitAt + 2).replace(/^./, (c) => c.toUpperCase())}`;
          next = next.replace(long, rewritten);
          pushChange(
            changes,
            citations,
            long.slice(0, 60) + "…",
            rewritten.slice(0, 60) + "…",
            "Split a 30+ word sentence for readability.",
            finding.src,
          );
        }
      }
    }
  }

  next = next.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  return { text: next, alt: nextAlt, fg: nextFg, bg: nextBg, changes, citations };
}

export function mockRewrite(input: RewriteInput): RewriteProposal {
  const scanned = scanContent(input, input.rules, input.facts);
  const open = openFindings(scanned, input.dismissed);
  const safePass = applySafeClone(input.text, open);
  const afterSafe = scanContent(
    { ...input, text: safePass.text },
    input.rules,
    input.facts,
  );
  const remaining = openFindings(afterSafe, input.dismissed).filter((f) => !isSafeFix(f));
  const rewritten = rewriteRemaining(
    safePass.text,
    input.alt,
    input.fg,
    input.bg,
    input.hasImg,
    remaining,
  );
  const allChanges = [...safePass.changes, ...rewritten.changes];
  const uniqueCitations = new Map<string, string>(rewritten.citations);
  for (const change of safePass.changes) {
    if (!uniqueCitations.has(change.src)) uniqueCitations.set(change.src, change.reason);
  }
  const checked = scanContent(
    {
      text: rewritten.text,
      alt: rewritten.alt,
      fg: rewritten.fg,
      bg: rewritten.bg,
      hasImg: input.hasImg,
    },
    input.rules,
    input.facts,
  );
  return {
    source: "mock",
    beforeText: input.text,
    afterText: rewritten.text,
    beforeAlt: input.alt,
    afterAlt: rewritten.alt,
    beforeFg: input.fg,
    afterFg: rewritten.fg,
    beforeBg: input.bg,
    afterBg: rewritten.bg,
    citations: [...uniqueCitations.entries()].map(([src, note]) => ({ src, note })),
    changes: allChanges,
    remainingOpen: openFindings(checked, input.dismissed).length,
  };
}

function extractJson(raw: string): {
  text?: string;
  alt?: string;
  fg?: string;
  bg?: string;
  changes?: RewriteChange[];
  citations?: { src: string; note: string }[];
} | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as {
      text?: string;
      alt?: string;
      fg?: string;
      bg?: string;
      changes?: RewriteChange[];
      citations?: { src: string; note: string }[];
    };
  } catch {
    return null;
  }
}

export async function liveOrMockRewrite(
  input: RewriteInput,
  apiKey?: string,
): Promise<RewriteProposal> {
  if (!apiKey) return mockRewrite(input);

  const open = openFindings(scanContent(input, input.rules, input.facts), input.dismissed);
  const remaining = open.filter((f) => !isSafeFix(f));
  const safePass = applySafeClone(input.text, open);
  const prompt = `You rewrite marketing copy to match a Brand Kit. You must not invent facts, rankings, or guarantees.
First, the text already had deterministic safe replacements applied:
"""${safePass.text}"""
Remaining engine findings (only these may be rewritten; do not add new claims):
${findingsBrief(remaining)}
${kitBrief(input.rules, input.facts)}
Current alt="${input.alt}" fg="${input.fg}" bg="${input.bg}" hasImg=${input.hasImg}
Return JSON only:
{"text":"...","alt":"...","fg":"...","bg":"...","changes":[{"before":"","after":"","reason":"","src":""}],"citations":[{"src":"","note":""}]}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a brand-governance rewriter. Never invent proof points. Cite kit sources. JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return mockRewrite(input);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = extractJson(data.choices?.[0]?.message?.content ?? "");
    if (!parsed?.text) return mockRewrite(input);
    const afterText = parsed.text;
    const afterAlt = parsed.alt ?? input.alt;
    const afterFg = parsed.fg ?? input.fg;
    const afterBg = parsed.bg ?? input.bg;
    const checked = scanContent(
      { text: afterText, alt: afterAlt, fg: afterFg, bg: afterBg, hasImg: input.hasImg },
      input.rules,
      input.facts,
    );
    return {
      source: "openai",
      beforeText: input.text,
      afterText,
      beforeAlt: input.alt,
      afterAlt,
      beforeFg: input.fg,
      afterFg,
      beforeBg: input.bg,
      afterBg,
      citations: parsed.citations?.length
        ? parsed.citations
        : [{ src: "Brand Kit", note: "OpenAI rewrite, re-checked by the rule engine." }],
      changes: [
        ...safePass.changes,
        ...(parsed.changes ?? [
          {
            before: input.text.slice(0, 80),
            after: afterText.slice(0, 80),
            reason: "Brand-grounded rewrite of remaining issues.",
            src: "Brand Kit",
          },
        ]),
      ],
      remainingOpen: openFindings(checked, input.dismissed).length,
    };
  } catch {
    return mockRewrite(input);
  }
}

export async function liveOrMockOverride(
  title: string,
  draft: string,
  apiKey?: string,
): Promise<{ text: string; source: "mock" | "openai" }> {
  if (!apiKey) return { text: draft, source: "mock" };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Draft a short manager override justification. Keep every cited finding. Do not deny the engine. JSON {\"text\":\"...\"}.",
          },
          {
            role: "user",
            content: `Piece: ${title}\nSeed justification:\n${draft}`,
          },
        ],
      }),
    });
    if (!res.ok) return { text: draft, source: "mock" };
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = extractJson(data.choices?.[0]?.message?.content ?? "");
    if (parsed && "text" in parsed && typeof parsed.text === "string" && parsed.text.trim()) {
      return { text: parsed.text.trim(), source: "openai" };
    }
    return { text: draft, source: "mock" };
  } catch {
    return { text: draft, source: "mock" };
  }
}

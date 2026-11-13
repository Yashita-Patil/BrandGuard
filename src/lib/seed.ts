import {
  FACTS,
  RULES,
  SAMPLE_AD,
  SAMPLE_CLEAN,
  SAMPLE_FACTS,
  SAMPLE_MESSY,
  USERS,
} from "./brand";
import { scanContent } from "./engine";
import type {
  BrandState,
  Comment,
  ContentDoc,
  Decision,
  HistoryEntry,
  Role,
} from "./types";

const T0 = Date.parse("2026-11-03T08:30:00Z");
const hour = 60 * 60 * 1000;

function when(h: number): number {
  return T0 + h * hour;
}

function history(
  t: number,
  role: Role,
  action: HistoryEntry["action"],
  what: string,
  text: string,
  extra?: Partial<HistoryEntry>,
): HistoryEntry {
  return {
    t,
    who: USERS[role].name,
    role,
    action,
    what,
    text,
    alt: extra?.alt ?? "",
    fg: extra?.fg ?? "",
    bg: extra?.bg ?? "",
  };
}

function comment(
  t: number,
  role: Role,
  text: string,
  kind: Comment["kind"],
): Comment {
  return { t, who: USERS[role].name, role, text, kind };
}

function decision(
  t: number,
  role: Role,
  outcome: Decision["outcome"],
  note: string,
  override = false,
  openHighCount = 0,
): Decision {
  return {
    t,
    who: USERS[role].name,
    role,
    outcome,
    note,
    override,
    openHighCount,
  };
}

function doc(partial: ContentDoc): ContentDoc {
  const findings = scanContent(partial, RULES, FACTS);
  return { ...partial, lastFindings: findings };
}

export function seedState(): BrandState {
  const launchOriginal = SAMPLE_MESSY.text;
  const launchCurrent =
    "Introducing Northwind Pro — the BEST laptop in the world! Our revolutionary battery lasts up to 18 hours and we use affordable components so members save big. Founded in 2012, we offer free shipping over ₹999 and guaranteed results. Click here to use our launch offer. Power members and new members can use Northwind every day.";

  const aboutCurrent =
    "Northwind was founded in 2010. Enjoy free shipping above ₹1,500 and a 60-day money-back window on every order. Our members love the Northwind Pro.";

  const docs: ContentDoc[] = [
    doc({
      id: "doc-sample-draft",
      title: SAMPLE_MESSY.title,
      type: SAMPLE_MESSY.type,
      text: SAMPLE_MESSY.text,
      alt: SAMPLE_MESSY.alt,
      fg: SAMPLE_MESSY.fg,
      bg: SAMPLE_MESSY.bg,
      hasImg: true,
      img: SAMPLE_MESSY.img,
      status: "draft",
      author: USERS.creator.name,
      authorRole: "creator",
      originalText: SAMPLE_MESSY.text,
      originalAlt: SAMPLE_MESSY.alt,
      originalFg: SAMPLE_MESSY.fg,
      originalBg: SAMPLE_MESSY.bg,
      dismissed: {},
      comments: [],
      history: [
        history(when(-2), "creator", "created", "Started draft from campaign brief", SAMPLE_MESSY.text, {
          alt: SAMPLE_MESSY.alt,
          fg: SAMPLE_MESSY.fg,
          bg: SAMPLE_MESSY.bg,
        }),
      ],
      decisions: [],
      appliedFixes: [],
      lastFindings: [],
      revision: 0,
      submitCount: 0,
    }),
    doc({
      id: "doc-launch",
      title: SAMPLE_MESSY.title,
      type: SAMPLE_MESSY.type,
      text: launchCurrent,
      alt: "Northwind Pro laptop on a yellow desk",
      fg: "#0B3D91",
      bg: "#FFFFFF",
      hasImg: true,
      img: SAMPLE_MESSY.img,
      status: "in_review",
      author: USERS.creator.name,
      authorRole: "creator",
      originalText: launchOriginal,
      originalAlt: SAMPLE_MESSY.alt,
      originalFg: SAMPLE_MESSY.fg,
      originalBg: SAMPLE_MESSY.bg,
      dismissed: {},
      comments: [
        comment(
          when(2),
          "creator",
          "Submitted after applying safe terminology and fact fixes. Claims still need a reviewer look.",
          "comment",
        ),
      ],
      history: [
        history(when(0), "creator", "created", "Created draft", launchOriginal, {
          alt: SAMPLE_MESSY.alt,
          fg: SAMPLE_MESSY.fg,
          bg: SAMPLE_MESSY.bg,
        }),
        history(
          when(1),
          "creator",
          "applied_all_safe",
          "Applied all safe fixes (brand name, jargon, facts, punctuation)",
          launchCurrent,
          { alt: "Northwind Pro laptop on a yellow desk", fg: "#0B3D91", bg: "#FFFFFF" },
        ),
        history(when(2), "creator", "submitted", "Submitted for review (revision 1)", launchCurrent, {
          alt: "Northwind Pro laptop on a yellow desk",
          fg: "#0B3D91",
          bg: "#FFFFFF",
        }),
      ],
      decisions: [],
      appliedFixes: [
        { t: when(1), match: "NorthWind", fix: "Northwind", ruleId: "t3" },
        { t: when(1), match: "leverage", fix: "use", ruleId: "t1" },
        { t: when(1), match: "utilize", fix: "use", ruleId: "t1" },
        { t: when(1), match: "cheap", fix: "affordable", ruleId: "t2" },
        { t: when(1), match: "users", fix: "members", ruleId: "t4" },
        { t: when(1), match: "!!", fix: "!", ruleId: "m2" },
      ],
      lastFindings: [],
      submittedAt: when(2),
      revision: 1,
      submitCount: 1,
    }),
    doc({
      id: "doc-about",
      title: SAMPLE_FACTS.title,
      type: SAMPLE_FACTS.type,
      text: aboutCurrent,
      alt: "",
      fg: "#0B3D91",
      bg: "#FFFFFF",
      hasImg: false,
      img: "",
      status: "changes_requested",
      author: USERS.creator.name,
      authorRole: "creator",
      reviewer: USERS.reviewer.name,
      reviewerRole: "reviewer",
      originalText: SAMPLE_FACTS.text,
      originalAlt: "",
      originalFg: "#0B3D91",
      originalBg: "#FFFFFF",
      dismissed: {},
      comments: [
        comment(
          when(30),
          "reviewer",
          "Please correct founding year (2012), free-shipping threshold (₹999), and returns window (30 days). Do not leave outdated facts in an About page.",
          "change_request",
        ),
      ],
      history: [
        history(when(26), "creator", "created", "Created draft", SAMPLE_FACTS.text),
        history(when(27), "creator", "submitted", "Submitted for review (revision 1)", SAMPLE_FACTS.text),
        history(
          when(30),
          "reviewer",
          "requested_changes",
          "Requested changes: correct founding year, shipping, and returns facts",
          aboutCurrent,
        ),
      ],
      decisions: [
        decision(
          when(30),
          "reviewer",
          "changes_requested",
          "Correct founding year, shipping threshold, and returns window before this can go live.",
          false,
          3,
        ),
      ],
      appliedFixes: [
        { t: when(28), match: "users", fix: "members", ruleId: "t4" },
        { t: when(28), match: "NorthWind", fix: "Northwind", ruleId: "t3" },
      ],
      lastFindings: [],
      submittedAt: when(27),
      reviewedAt: when(30),
      revision: 1,
      submitCount: 1,
    }),
    doc({
      id: "doc-spring",
      title: SAMPLE_CLEAN.title,
      type: SAMPLE_CLEAN.type,
      text: SAMPLE_CLEAN.text,
      alt: SAMPLE_CLEAN.alt,
      fg: SAMPLE_CLEAN.fg,
      bg: SAMPLE_CLEAN.bg,
      hasImg: false,
      img: "",
      status: "approved",
      author: USERS.creator.name,
      authorRole: "creator",
      reviewer: USERS.reviewer.name,
      reviewerRole: "reviewer",
      approver: USERS.manager.name,
      approverRole: "manager",
      originalText: SAMPLE_CLEAN.text,
      originalAlt: SAMPLE_CLEAN.alt,
      originalFg: SAMPLE_CLEAN.fg,
      originalBg: SAMPLE_CLEAN.bg,
      dismissed: {},
      comments: [
        comment(when(50), "reviewer", "Facts and tone look correct. Ready for manager approval.", "comment"),
        comment(
          when(52),
          "manager",
          "Approved. Copy matches Voice Guide, Claims Policy, and the 2026 fact sheet.",
          "approval",
        ),
      ],
      history: [
        history(when(44), "creator", "created", "Created draft", SAMPLE_CLEAN.text, {
          alt: SAMPLE_CLEAN.alt,
          fg: SAMPLE_CLEAN.fg,
          bg: SAMPLE_CLEAN.bg,
        }),
        history(when(45), "creator", "submitted", "Submitted for review (revision 1)", SAMPLE_CLEAN.text),
        history(when(52), "manager", "approved", "Approved — no open high-severity findings", SAMPLE_CLEAN.text),
      ],
      decisions: [
        decision(
          when(52),
          "manager",
          "approved",
          "Approved. Copy matches Voice Guide, Claims Policy, and the 2026 fact sheet.",
        ),
      ],
      appliedFixes: [],
      lastFindings: [],
      submittedAt: when(45),
      reviewedAt: when(50),
      approvedAt: when(52),
      revision: 1,
      submitCount: 1,
    }),
    doc({
      id: "doc-ad",
      title: SAMPLE_AD.title,
      type: SAMPLE_AD.type,
      text: SAMPLE_AD.text,
      alt: "",
      fg: SAMPLE_AD.fg,
      bg: SAMPLE_AD.bg,
      hasImg: false,
      img: "",
      status: "approved",
      author: USERS.creator.name,
      authorRole: "creator",
      reviewer: USERS.manager.name,
      reviewerRole: "manager",
      approver: USERS.manager.name,
      approverRole: "manager",
      originalText:
        "NorthWind Pro for users who move. Battery life up to 24 hours. Free shipping over ₹499. 60-day returns on every order.",
      originalAlt: "",
      originalFg: SAMPLE_AD.fg,
      originalBg: SAMPLE_AD.bg,
      dismissed: {},
      comments: [
        comment(
          when(70),
          "manager",
          "Facts now match the spec sheet. Approved for the weekend campaign.",
          "approval",
        ),
      ],
      history: [
        history(
          when(60),
          "creator",
          "created",
          "Created draft",
          "NorthWind Pro for users who move. Battery life up to 24 hours. Free shipping over ₹499. 60-day returns on every order.",
        ),
        history(
          when(62),
          "creator",
          "applied_all_safe",
          "Applied all safe fixes",
          SAMPLE_AD.text,
        ),
        history(when(63), "creator", "submitted", "Submitted for review (revision 1)", SAMPLE_AD.text),
        history(when(70), "manager", "approved", "Approved for weekend campaign", SAMPLE_AD.text),
      ],
      decisions: [
        decision(
          when(70),
          "manager",
          "approved",
          "Facts now match the spec sheet. Approved for the weekend campaign.",
        ),
      ],
      appliedFixes: [
        { t: when(62), match: "NorthWind", fix: "Northwind", ruleId: "t3" },
        { t: when(62), match: "users", fix: "members", ruleId: "t4" },
        { t: when(62), match: "24 hours", fix: "18 hours", ruleId: "f3" },
        { t: when(62), match: "₹499", fix: "₹999", ruleId: "f2" },
        { t: when(62), match: "60-day", fix: "30-day", ruleId: "f4" },
      ],
      lastFindings: [],
      submittedAt: when(63),
      reviewedAt: when(70),
      approvedAt: when(70),
      revision: 1,
      submitCount: 1,
    }),
    doc({
      id: "doc-hype",
      title: "Homepage hero",
      type: "Web page",
      text: "A game-changing laptop for members. Northwind Pro is the fastest notebook we have ever shipped!! Click here if you want the revolutionary battery story.",
      alt: "",
      fg: "#0B3D91",
      bg: "#FFFFFF",
      hasImg: false,
      img: "",
      status: "changes_requested",
      author: USERS.creator.name,
      authorRole: "creator",
      reviewer: USERS.reviewer.name,
      reviewerRole: "reviewer",
      originalText:
        "A game-changing laptop for users. NorthWind Pro is the fastest notebook we have ever shipped!! Click here if you want the revolutionary battery story.",
      originalAlt: "",
      originalFg: "#0B3D91",
      originalBg: "#FFFFFF",
      dismissed: {},
      comments: [
        comment(
          when(90),
          "reviewer",
          "Drop hype words (game-changing, revolutionary), the unsupported ‘fastest’ claim, the double exclamation, and rewrite ‘Click here’.",
          "change_request",
        ),
      ],
      history: [
        history(
          when(80),
          "creator",
          "created",
          "Created draft",
          "A game-changing laptop for users. NorthWind Pro is the fastest notebook we have ever shipped!! Click here if you want the revolutionary battery story.",
        ),
        history(
          when(82),
          "creator",
          "submitted",
          "Submitted for review (revision 1)",
          "A game-changing laptop for members. Northwind Pro is the fastest notebook we have ever shipped!! Click here if you want the revolutionary battery story.",
        ),
        history(
          when(90),
          "reviewer",
          "requested_changes",
          "Requested changes on tone, claims, and link text",
          "A game-changing laptop for members. Northwind Pro is the fastest notebook we have ever shipped!! Click here if you want the revolutionary battery story.",
        ),
      ],
      decisions: [
        decision(
          when(90),
          "reviewer",
          "changes_requested",
          "Drop hype words, the unsupported ‘fastest’ claim, and rewrite ‘Click here’.",
          false,
          1,
        ),
      ],
      appliedFixes: [
        { t: when(81), match: "users", fix: "members", ruleId: "t4" },
        { t: when(81), match: "NorthWind", fix: "Northwind", ruleId: "t3" },
      ],
      lastFindings: [],
      submittedAt: when(82),
      reviewedAt: when(90),
      revision: 1,
      submitCount: 1,
    }),
  ];

  return {
    version: 3,
    rules: RULES.map((rule) => ({ ...rule })),
    facts: FACTS.map((fact) => ({ ...fact })),
    docs,
  };
}

export function blankDoc(author: string, authorRole: Role): ContentDoc {
  return {
    id: "",
    title: "",
    type: "Social post",
    text: "",
    alt: "",
    fg: "",
    bg: "",
    hasImg: false,
    img: "",
    status: "draft",
    author,
    authorRole,
    originalText: "",
    originalAlt: "",
    originalFg: "",
    originalBg: "",
    dismissed: {},
    comments: [],
    history: [],
    decisions: [],
    appliedFixes: [],
    lastFindings: [],
    revision: 0,
    submitCount: 0,
  };
}

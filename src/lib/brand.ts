import type { Fact, Rule, User } from "./types";

export const USERS: Record<User["id"], User> = {
  creator: { id: "creator", name: "Asha Patel", title: "Creator" },
  manager: { id: "manager", name: "Ravi Menon", title: "Manager" },
  reviewer: { id: "reviewer", name: "Meera Shah", title: "Reviewer" },
};

export const PALETTE = [
  "#0B3D91",
  "#FFFFFF",
  "#F4B400",
  "#1A1A1A",
  "#E8EEF9",
] as const;

export const BUILTIN: Record<string, [string, string]> = {
  "a11y-alt": ["Accessibility", "Missing or weak image alt text"],
  "a11y-contrast": ["Accessibility", "Low text contrast"],
  "a11y-link": ["Accessibility", "Non-descriptive link text"],
  "a11y-long": ["Accessibility", "Very long sentence"],
  "vis-palette": ["Visual", "Colour outside approved palette"],
};

export const RULES: Rule[] = [
  {
    id: "t1",
    cat: "Terminology",
    sev: "medium",
    re: "\\b(utili[sz]e|leverage)\\b",
    fix: "use",
    why: "Plain words are preferred over corporate jargon.",
    src: "Voice Guide §2.1 – Plain words",
  },
  {
    id: "t2",
    cat: "Terminology",
    sev: "medium",
    re: "\\bcheap\\b",
    fix: "affordable",
    why: "‘Cheap’ undermines our premium positioning.",
    src: "Terminology List – avoid ‘cheap’",
  },
  {
    id: "t3",
    cat: "Terminology",
    sev: "high",
    re: "NorthWind|North Wind|Northwind Inc\\.?",
    fix: "Northwind",
    why: "The brand name is always written ‘Northwind’.",
    src: "Brand Name Usage §1.1",
  },
  {
    id: "t4",
    cat: "Terminology",
    sev: "low",
    re: "\\busers?\\b",
    fix: "members",
    why: "We call people ‘members’, not ‘users’.",
    src: "Terminology List – audience terms",
  },
  {
    id: "c1",
    cat: "Claims",
    sev: "high",
    re: "\\b(best|#1|number one|fastest|world['’]s (?:best|leading))\\b( in the world)?",
    hint: "Superlatives need evidence. Replace with a verifiable fact, e.g. ‘rated 4.7/5 by 3,200 members’.",
    why: "Unsupported superlative with no approved proof point.",
    src: "Claims Policy §3 – Superlatives need evidence",
  },
  {
    id: "c2",
    cat: "Claims",
    sev: "high",
    re: "\\b(guaranteed|risk-free|zero risk|clinically proven|100% (?:safe|guaranteed))\\b",
    hint: "Remove the guarantee or cite the approved warranty terms (30-day returns).",
    why: "Absolute guarantees create legal exposure.",
    src: "Claims Policy §4 – Guarantees",
  },
  {
    id: "m1",
    cat: "Tone",
    sev: "medium",
    re: "\\b(revolutionary|game-changing|miracle)\\b",
    hint: "Describe the concrete benefit instead of hype.",
    why: "Our voice is confident and calm, never hype-driven.",
    src: "Voice Guide §1.2 – No hype words",
  },
  {
    id: "m2",
    cat: "Tone",
    sev: "low",
    re: "!{2,}",
    fix: "!",
    why: "Use at most one exclamation mark.",
    src: "Voice Guide §1.4 – Punctuation",
  },
  {
    id: "m3",
    cat: "Tone",
    sev: "low",
    re: "\\b[A-Z]{4,}\\b",
    hint: "Use sentence case instead of shouting in capitals (acronyms are fine).",
    why: "ALL CAPS reads as shouting.",
    src: "Voice Guide §1.4 – Punctuation",
  },
];

export const FACTS: Fact[] = [
  {
    id: "f1",
    label: "Founded in 2012",
    re: "founded in (\\d{4})",
    val: "2012",
    src: "Company Fact Sheet 2026",
  },
  {
    id: "f2",
    label: "Free shipping over ₹999",
    re: "free shipping (?:on orders )?(?:over|above) [₹$]?\\s?([\\d,]+)",
    val: "999",
    src: "Shipping Policy 2026",
  },
  {
    id: "f3",
    label: "Battery life up to 18 hours",
    re: "battery[^.]{0,30}?(\\d+)\\s*hours?",
    val: "18",
    src: "Northwind Pro Spec Sheet v4",
  },
  {
    id: "f4",
    label: "30-day returns",
    re: "(\\d+)[- ]day (?:money[- ]back|returns?)",
    val: "30",
    src: "Returns Policy 2026",
  },
];

export const SAMPLE_MESSY = {
  title: "Northwind Pro launch post",
  type: "Social post" as const,
  text: "Introducing NorthWind Pro — the BEST laptop in the world!! Our revolutionary battery lasts up to 24 hours and we leverage cheap components so users save big. Founded in 2015, we offer free shipping over ₹499 and guaranteed results. Click here to utilize our launch offer. Power users and new users can leverage NorthWind every day.",
  alt: "image",
  fg: "#F4B400",
  bg: "#FFFFFF",
  hasImg: true,
  img: "/samples/test-image.png",
};

export const SAMPLE_CLEAN = {
  title: "Spring newsletter intro",
  type: "Email" as const,
  text: "Meet the Northwind Pro, built for members who work wherever ideas find them. The battery lasts up to 18 hours, and orders over ₹999 ship free. Not happy? Every purchase includes 30-day returns. View the pricing details on our website.",
  alt: "Northwind Pro laptop open on a wooden desk beside a coffee cup",
  fg: "#0B3D91",
  bg: "#FFFFFF",
  hasImg: false,
  img: "",
};

export const SAMPLE_FACTS = {
  title: "About us blurb",
  type: "Web page" as const,
  text: "Northwind was founded in 2010. Enjoy free shipping above ₹1,500 and a 60-day money-back window on every order. Our users love the NorthWind Pro.",
  alt: "",
  fg: "#0B3D91",
  bg: "#FFFFFF",
  hasImg: false,
  img: "",
};

export const SAMPLE_AD = {
  title: "Member weekend ad",
  type: "Ad copy" as const,
  text: "Northwind Pro for members who move. Battery life up to 18 hours. Free shipping over ₹999. 30-day returns on every order.",
  alt: "",
  fg: "#0B3D91",
  bg: "#FFFFFF",
  hasImg: false,
  img: "",
};

export type Role = "creator" | "manager" | "reviewer";

export type Severity = "high" | "medium" | "low";

export type DocStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved";

export type ContentType =
  | "Social post"
  | "Email"
  | "Web page"
  | "Ad copy"
  | "Image / design";

export type Tab =
  | "review"
  | "queue"
  | "analytics"
  | "kit"
  | "trust";

export type CommentKind =
  | "comment"
  | "change_request"
  | "approval"
  | "resubmit"
  | "override";

export type HistoryAction =
  | "created"
  | "saved"
  | "scanned"
  | "applied_fix"
  | "applied_all_safe"
  | "dismissed"
  | "submitted"
  | "resubmitted"
  | "requested_changes"
  | "approved"
  | "override_approved"
  | "restored"
  | "commented"
  | "proposed_rewrite"
  | "accepted_rewrite"
  | "discarded_rewrite";

export interface User {
  id: Role;
  name: string;
  title: string;
}

export interface Rule {
  id: string;
  cat: string;
  sev: Severity;
  re: string;
  fix?: string;
  hint?: string;
  why: string;
  src: string;
  custom?: boolean;
}

export interface Fact {
  id: string;
  label: string;
  re: string;
  val: string;
  src: string;
}

export interface Finding {
  ruleId: string;
  cat: string;
  sev: Severity;
  match: string;
  fix: string | null;
  hint?: string;
  why: string;
  src: string;
  key: string;
  occurrences: number;
}

export interface FindingGroup {
  ruleId: string;
  cat: string;
  sev: Severity;
  why: string;
  src: string;
  hint?: string;
  label: string;
  count: number;
  uniqueMatches: number;
  findings: Finding[];
  hasSafeFix: boolean;
}

export interface Comment {
  t: number;
  who: string;
  role: Role;
  text: string;
  kind: CommentKind;
}

export interface HistoryEntry {
  t: number;
  who: string;
  role: Role;
  action: HistoryAction;
  what: string;
  text: string;
  alt: string;
  fg: string;
  bg: string;
}

export interface Decision {
  t: number;
  who: string;
  role: Role;
  outcome: "approved" | "changes_requested";
  note: string;
  override: boolean;
  openHighCount: number;
}

export interface AppliedFix {
  t: number;
  match: string;
  fix: string;
  ruleId: string;
}

export interface ContentDoc {
  id: string;
  title: string;
  type: ContentType;
  text: string;
  alt: string;
  fg: string;
  bg: string;
  hasImg: boolean;
  img: string;
  status: DocStatus;
  author: string;
  authorRole: Role;
  reviewer?: string;
  reviewerRole?: Role;
  approver?: string;
  approverRole?: Role;
  originalText: string;
  originalAlt: string;
  originalFg: string;
  originalBg: string;
  dismissed: Record<string, boolean>;
  comments: Comment[];
  history: HistoryEntry[];
  decisions: Decision[];
  appliedFixes: AppliedFix[];
  lastFindings: Finding[];
  submittedAt?: number;
  reviewedAt?: number;
  approvedAt?: number;
  revision: number;
  submitCount: number;
}

export interface BrandState {
  version: 3;
  rules: Rule[];
  facts: Fact[];
  docs: ContentDoc[];
}

export type RiskLevel = "ship" | "hold" | "block";

export type RewriteSource = "mock" | "openai";

export interface RiskEvidence {
  ruleId: string;
  label: string;
  sev: Severity;
  src: string;
  match: string;
  businessRisk: string;
}

export interface RiskScore {
  level: RiskLevel;
  summary: string;
  evidence: RiskEvidence[];
  high: number;
  medium: number;
  low: number;
}

export interface RewriteChange {
  before: string;
  after: string;
  reason: string;
  src: string;
}

export interface RewriteProposal {
  source: RewriteSource;
  beforeText: string;
  afterText: string;
  beforeAlt: string;
  afterAlt: string;
  beforeFg: string;
  afterFg: string;
  beforeBg: string;
  afterBg: string;
  citations: { src: string; note: string }[];
  changes: RewriteChange[];
  remainingOpen: number;
}

export interface AppSession {
  role: Role;
  tab: Tab;
  currentId: string | null;
  severityFilter: "all" | Severity;
  onboarded: boolean;
}

export function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

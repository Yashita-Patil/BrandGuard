import { assertNever } from "./types";
import type {
  CommentKind,
  ContentType,
  DocStatus,
  HistoryAction,
  Role,
  Severity,
  Tab,
} from "./types";

export function roleLabel(role: Role): string {
  switch (role) {
    case "creator":
      return "Creator";
    case "manager":
      return "Manager";
    case "reviewer":
      return "Reviewer";
    default:
      return assertNever(role, "Unknown role");
  }
}

export function statusLabel(status: DocStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "in_review":
      return "In review";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    default:
      return assertNever(status, "Unknown status");
  }
}

export function statusTone(status: DocStatus): "neutral" | "warn" | "danger" | "ok" {
  switch (status) {
    case "draft":
      return "neutral";
    case "in_review":
      return "warn";
    case "changes_requested":
      return "danger";
    case "approved":
      return "ok";
    default:
      return assertNever(status, "Unknown status tone");
  }
}

export function severityLabel(sev: Severity): string {
  switch (sev) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return assertNever(sev, "Unknown severity");
  }
}

export function tabLabel(tab: Tab): string {
  switch (tab) {
    case "review":
      return "Review";
    case "queue":
      return "Queue";
    case "analytics":
      return "Analytics";
    case "kit":
      return "Brand Kit";
    case "trust":
      return "Trust";
    default:
      return assertNever(tab, "Unknown tab");
  }
}

export function commentKindLabel(kind: CommentKind): string {
  switch (kind) {
    case "comment":
      return "Comment";
    case "change_request":
      return "Change request";
    case "approval":
      return "Approval";
    case "resubmit":
      return "Resubmit";
    case "override":
      return "Override";
    default:
      return assertNever(kind, "Unknown comment kind");
  }
}

export function historyActionLabel(action: HistoryAction): string {
  switch (action) {
    case "created":
      return "Created";
    case "saved":
      return "Saved";
    case "scanned":
      return "Scanned";
    case "applied_fix":
      return "Applied fix";
    case "applied_all_safe":
      return "Applied all safe fixes";
    case "dismissed":
      return "Dismissed";
    case "submitted":
      return "Submitted";
    case "resubmitted":
      return "Resubmitted";
    case "requested_changes":
      return "Requested changes";
    case "approved":
      return "Approved";
    case "override_approved":
      return "Approved with override";
    case "restored":
      return "Restored";
    case "commented":
      return "Commented";
    case "proposed_rewrite":
      return "Proposed rewrite";
    case "accepted_rewrite":
      return "Accepted rewrite";
    case "discarded_rewrite":
      return "Discarded rewrite";
    default:
      return assertNever(action, "Unknown history action");
  }
}

export function contentTypes(): ContentType[] {
  return ["Social post", "Email", "Web page", "Ad copy", "Image / design"];
}

export function formatWhen(t: number): string {
  return new Date(t).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

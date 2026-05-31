import type { DatasetStatus, ReportStatus, UserRole } from "@/types/domain";
import { canModerate } from "@/server/auth/permissions";

export type ModerationDecision = "approve" | "reject" | "lock" | "unlock" | "restore" | "dismiss";

export type ModerationInput = {
  decision: ModerationDecision;
  actorRole: UserRole;
  currentDatasetStatus?: DatasetStatus;
  currentReportStatus?: ReportStatus;
};

export type ModerationResult = {
  datasetStatus?: DatasetStatus;
  reportStatus?: ReportStatus;
  auditAction: "approve" | "reject" | "lock" | "unlock" | "restore";
  notifyWatchers: boolean;
};

export function resolveModerationDecision(input: ModerationInput): ModerationResult {
  if (!canModerate(input.actorRole)) {
    throw new Error("Moderator access required.");
  }

  switch (input.decision) {
    case "approve":
      return { datasetStatus: "published", reportStatus: "resolved", auditAction: "approve", notifyWatchers: true };
    case "reject":
      return { datasetStatus: input.currentDatasetStatus ?? "pending_review", reportStatus: "resolved", auditAction: "reject", notifyWatchers: true };
    case "lock":
      return { datasetStatus: "locked", reportStatus: input.currentReportStatus ?? "triaged", auditAction: "lock", notifyWatchers: true };
    case "unlock":
      return { datasetStatus: "published", reportStatus: input.currentReportStatus ?? "triaged", auditAction: "unlock", notifyWatchers: true };
    case "restore":
      return { datasetStatus: input.currentDatasetStatus ?? "published", reportStatus: "resolved", auditAction: "restore", notifyWatchers: true };
    case "dismiss":
      return { datasetStatus: input.currentDatasetStatus, reportStatus: "dismissed", auditAction: "reject", notifyWatchers: false };
    default:
      input.decision satisfies never;
      throw new Error("Unsupported moderation decision.");
  }
}


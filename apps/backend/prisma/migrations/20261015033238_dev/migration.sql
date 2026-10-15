-- RenameIndex
ALTER INDEX "requirement_reminder_deliveries_pending_schedule_idx" RENAME TO "requirement_reminder_deliveries_status_scheduledAt_idx";

-- RenameIndex
ALTER INDEX "requirement_reminder_deliveries_requirement_status_idx" RENAME TO "requirement_reminder_deliveries_requirementId_status_idx";

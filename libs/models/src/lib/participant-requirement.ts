export type ParticipantRequirement = {
  id: string;
  name: string;
  programId: string;
  programName: string;
  dueAt: string;
  isCompleted: boolean;
  canComplete: boolean;
  /** False when staff see a program they manage but are not enrolled in. */
  isEnrolled: boolean;
};

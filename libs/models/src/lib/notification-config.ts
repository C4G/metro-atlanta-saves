export type NotificationConfig = {
  id: string;
  createdAt: string;
  updatedAt: string;
  heading: string;
  body: string;
  programId?: string | null;
  userId?: string | null;
};

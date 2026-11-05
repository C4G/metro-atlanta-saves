import {
  Checkpoint,
  Image,
  ParticipantPayment as PaymentRecord,
  Requirement,
  RequirementCompletion,
  User,
} from '@mas/prisma-client/browser';

export type TaskReviewCompletion = Pick<
  RequirementCompletion,
  'requirementId' | 'completedAt' | 'completedById' | 'verifiedAt'
> & {
  verifiedBy: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
};

export type TaskReviewDocument = Pick<Image, 'id' | 'name' | 'type' | 'imageVerified' | 'createdAt'>;

export type TaskReviewCheckpoint = Pick<
  Checkpoint,
  'id' | 'name' | 'savedMoney' | 'creditScore' | 'application' | 'updatedAt'
> & { images: TaskReviewDocument[] };

export type ProgramMonth = { name: string; number: number };

export type TaskReviewData = {
  startDate: Date | string | null;
  months: ProgramMonth[];
  requirements: Pick<Requirement, 'id' | 'name' | 'dueAt' | 'month' | 'educationalContentId'>[];
  participants: (Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> &
    { requirementStatus: string[] } & {
      completions: TaskReviewCompletion[];
      checkpoints: TaskReviewCheckpoint[];
    })[];
};

export type FrequentTask = { id: string; name: string; educationalContentId: string | null };

export type SavedMonthlyPlan = {
  months: number;
  assignments: { requirementId: string; month: number | null }[];
  created: TaskReviewData['requirements'];
  removedRequirementIds: string[];
};

export type ParticipantPayment = Pick<
  PaymentRecord,
  'id' | 'createdAt' | 'userId' | 'amount' | 'paidAt' | 'checkNumber' | 'paidBy' | 'note' | 'proofName' | 'proofType'
>;

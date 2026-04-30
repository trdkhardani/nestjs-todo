import { Document } from 'mongoose';
import { Job } from 'bullmq';

export interface ExtendedJob<T> extends Job {
  data: T;
}

export enum JobStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
}

export interface JobDoc extends Document {
  readonly jobId: string;
  readonly userId: string;
  readonly queueName: string;
  readonly jobName: string;
  status: JobStatus;
  readonly createdAt: Date;
  finishedAt?: Date | null;
}

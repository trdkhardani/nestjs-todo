import { Job } from 'bullmq';

export interface JobTasksData {
  userId: string;
  tasks: {
    title: string;
    description?: string;
    categoryId?: string;
  }[];
}

export interface ExtendedJob<T> extends Job {
  data: T;
}

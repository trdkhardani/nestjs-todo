import { TaskStatus } from 'generated/prisma/enums';

export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string;
  categoryId?: string;
}

export interface GetTasksInput {
  userId: string;
  page?: number;
  limit?: number;
  status?: TaskStatus;
}

export interface GetTaskByIdInput {
  userId: string;
  taskId: string;
}

export interface UpdateTaskInput {
  userId: string;
  taskId: string;
  title?: string;
  description?: string;
  categoryId?: string | null;
}

export interface CheckTaskInput {
  userId: string;
  taskId: string;
}

export interface DeleteTaskInput {
  userId: string;
  taskId: string;
}

import { TaskStatus } from 'generated/prisma/enums';
import z from 'zod';

export const CreateTaskSchema = z.object({
  taskTitle: z.string().max(30),
  taskDescription: z.string().max(30).optional(),
  taskCategoryId: z.uuid().optional(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

export const GetTasksSchema = z.object({
  page: z.int().default(1).optional(),
  limit: z.int().default(10).optional(),
  taskStatus: z.enum([TaskStatus.FINISHED, TaskStatus.UNFINISHED]).optional(),
});

export type GetTasksDto = z.infer<typeof GetTasksSchema>;

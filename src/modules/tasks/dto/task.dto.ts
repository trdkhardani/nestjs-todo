import { TaskStatus } from 'generated/prisma/enums';
import z from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().max(30),
  description: z.string().max(30).optional(),
  categoryId: z.uuid().optional(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

export const GetTasksSchema = z.object({
  page: z.int().default(1).optional(),
  limit: z.int().default(10).optional(),
  status: z.enum([TaskStatus.FINISHED, TaskStatus.UNFINISHED]).optional(),
});

export type GetTasksDto = z.infer<typeof GetTasksSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().max(30).optional(),
  description: z.string().max(30).optional(),
  categoryId: z.uuid().optional().nullable(),
});

export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;

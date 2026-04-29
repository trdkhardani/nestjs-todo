import z, { object } from 'zod';

const parseBooleanQuery = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return value;
};

const parseCursorQuery = (value: unknown) => {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return JSON.parse(value);

  return value;
};

export const GetJobLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  useCursorPagination: z.preprocess(
    parseBooleanQuery,
    z.boolean().default(false),
  ),
  cursor: z.preprocess(
    parseCursorQuery,
    z
      .object({
        _id: z.coerce.string().min(1, '_id cannot be empty'),
        createdAt: z.coerce.date(),
      })
      .optional(),
  ),
});

export type GetJobsLogDto = z.infer<typeof GetJobLogsSchema>;

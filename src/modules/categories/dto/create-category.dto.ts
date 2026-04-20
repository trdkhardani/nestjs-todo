import z from 'zod';

export const CreateCategorySchema = z
  .object({
    name: z.string().max(20),
  })
  .required();

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

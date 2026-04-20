import z from 'zod';

export const CreateCategorySchema = z
  .object({
    categoryName: z.string().max(20),
  })
  .required();

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

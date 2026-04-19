import z from 'zod';

export const UpdateCategorySchema = z
  .object({
    categoryName: z.string().max(20),
  })
  .required();

export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;

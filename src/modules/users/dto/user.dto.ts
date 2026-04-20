import z from 'zod';

export const UpdateUserSchema = z
  .object({
    username: z.string().trim().max(15),
    name: z.string().trim().max(300),
  })
  .required()
  .superRefine((data, ctx) => {
    if (data.username.includes(' ')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username can not contain space',
        path: ['username'],
      });
    }
  });

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
  })
  .required();

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

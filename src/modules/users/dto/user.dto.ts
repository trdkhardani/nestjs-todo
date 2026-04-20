import z from 'zod';

export const UpdateUserSchema = z
  .object({
    userUsername: z.string().trim().max(15),
    userName: z.string().trim().max(300),
  })
  .required()
  .superRefine((data, ctx) => {
    if (data.userUsername.includes(' ')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username can not contain space',
        path: ['userUsername'],
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

import z from 'zod';

export const RegisterSchema = z
  .object({
    userUsername: z.string().trim().min(1, { message: 'Field cannot be empty' }).max(15),
    userName: z.string().trim().min(1, { message: 'Field cannot be empty' }).max(100),
    userEmail: z.email().trim().min(1, { message: 'Field cannot be empty' }).max(50),
    userPassword: z.string().min(8),
  })
  .required();

export type RegisterDto = z.infer<typeof RegisterSchema>;
// export class RegisterDto {
// }

export const LoginSchema = z
  .object({
    userUsername: z.string().optional(),
    userEmail: z.email().optional(),
    userPassword: z.string().min(8),
  })
  .superRefine((data, ctx) => {
    if (!data.userUsername && !data.userEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either username or email must be provided',
        path: ['userUsername', 'userEmail'],
      });
    }
  });

export type LoginDto = z.infer<typeof LoginSchema>;

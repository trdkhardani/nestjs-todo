import z from 'zod';

export const RegisterSchema = z
  .object({
    username: z.string().trim().min(1, { message: 'Field cannot be empty' }).max(15),
    name: z.string().trim().min(1, { message: 'Field cannot be empty' }).max(100),
    email: z.email().trim().min(1, { message: 'Field cannot be empty' }).max(50),
    password: z.string().min(8),
  })
  .required();

export type RegisterDto = z.infer<typeof RegisterSchema>;
// export class RegisterDto {
// }

export const LoginSchema = z
  .object({
    username: z.string().optional(),
    email: z.email().optional(),
    password: z.string().min(8),
  })
  .superRefine((data, ctx) => {
    if (!data.username && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either username or email must be provided',
        path: ['username', 'email'],
      });
    }
  });

export type LoginDto = z.infer<typeof LoginSchema>;

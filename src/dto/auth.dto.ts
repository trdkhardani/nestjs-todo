import z from 'zod';

export const RegisterSchema = z
  .object({
    userUsername: z.string().trim().min(1, { message: 'Field cannot be empty' }).max(15),
    userName: z.string().trim().min(1, { message: 'Field cannot be empty' }).max(100),
    userEmail: z.email().trim().min(1, { message: 'Field cannot be empty' }).max(50),
    userPassword: z.string().trim().min(8),
  })
  .required();

export type RegisterDto = z.infer<typeof RegisterSchema>;
// export class RegisterDto {
// }

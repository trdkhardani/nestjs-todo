import { MfaMethods } from 'generated/prisma/enums';
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

export const ActivateMfaSchema = z.object({
  mfaMethod: z.enum(MfaMethods),
});

export const VerifyMfaSchema = z.object({
  otpCode: z.coerce.string().min(6).max(6),
  mfaMethod: z.enum(MfaMethods),
});

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(8),
    newPassword: z.string().min(8),
  })
  .required();

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type ActivateMfaDto = z.infer<typeof ActivateMfaSchema>;
export type VerifyMfaDto = z.infer<typeof VerifyMfaSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

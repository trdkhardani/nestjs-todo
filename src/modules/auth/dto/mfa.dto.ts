import { MfaMethods } from 'generated/prisma/enums';
import z from 'zod';

export const SendEmailMfaSchema = z.object({
  mfaToken: z.coerce.string().min(1, 'mfaToken cannot be empty'),
});

export const VerifyMfaSchema = z.object({
  mfaToken: z.coerce.string().min(1, 'mfaToken cannot be empty'),
  mfaMethod: z.enum(MfaMethods),
  code: z.coerce.string().min(6).max(6),
});

export type SendEmailMfaDto = z.infer<typeof SendEmailMfaSchema>;
export type VerifyMfaDto = z.infer<typeof VerifyMfaSchema>;

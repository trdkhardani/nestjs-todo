import { MfaMethods } from 'generated/prisma/enums';

export interface VerifyMfaInput {
  mfaToken: string;
  mfaMethod: MfaMethods;
  code: string;
}

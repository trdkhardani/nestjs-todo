import { MfaMethods } from 'generated/prisma/enums';

export interface UserInfoInput {
  userId: string;
}

export interface UpdateUserInput {
  userId: string;
  username: string;
  name: string;
}

export interface ActivateMfaInput {
  userId: string;
  mfaMethod: MfaMethods;
}

export interface VerifyMfaInput {
  userId: string;
  mfaMethod: MfaMethods;
  otpCode: string;
}

export interface ChangePasswordInput {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export interface DeleteUserInput {
  userId: string;
}

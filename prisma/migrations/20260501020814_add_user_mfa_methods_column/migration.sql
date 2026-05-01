-- CreateEnum
CREATE TYPE "MfaMethods" AS ENUM ('EMAIL_BASED_OTP', 'AUTHENTICATOR_APP_TOTP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "user_mfa_methods" "MfaMethods"[] DEFAULT ARRAY[]::"MfaMethods"[];

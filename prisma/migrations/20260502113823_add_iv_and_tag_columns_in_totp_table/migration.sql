/*
  Warnings:

  - You are about to drop the column `totp_secret` on the `Totp` table. All the data in the column will be lost.
  - Added the required column `totp_secret_ciphertext` to the `Totp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totp_secret_iv` to the `Totp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totp_secret_tag` to the `Totp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Totp" DROP COLUMN "totp_secret",
ADD COLUMN     "totp_secret_ciphertext" TEXT NOT NULL,
ADD COLUMN     "totp_secret_iv" TEXT NOT NULL,
ADD COLUMN     "totp_secret_tag" TEXT NOT NULL;

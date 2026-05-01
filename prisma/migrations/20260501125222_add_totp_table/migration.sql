-- CreateTable
CREATE TABLE "Totp" (
    "totp_id" TEXT NOT NULL,
    "totp_secret" TEXT NOT NULL,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_last_used" TIMESTAMP(3),
    "totp_date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totp_date_updated" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Totp_pkey" PRIMARY KEY ("totp_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Totp_user_id_key" ON "Totp"("user_id");

-- AddForeignKey
ALTER TABLE "Totp" ADD CONSTRAINT "Totp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

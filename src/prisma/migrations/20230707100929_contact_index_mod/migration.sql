-- DropIndex
DROP INDEX "Contact_phoneNumber_email_idx";

-- CreateIndex
CREATE INDEX "Contact_phoneNumber_idx" ON "Contact"("phoneNumber");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

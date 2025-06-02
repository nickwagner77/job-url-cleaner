/*
  Warnings:

  - Added the required column `profile_id` to the `urls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "urls" ADD COLUMN     "profile_id" TEXT NOT NULL,
ALTER COLUMN "import_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "urls" ADD CONSTRAINT "urls_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

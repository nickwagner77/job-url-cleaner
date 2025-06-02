/*
  Warnings:

  - You are about to drop the column `profile_id` on the `urls` table. All the data in the column will be lost.
  - Added the required column `import_id` to the `urls` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "urls" DROP CONSTRAINT "urls_profile_id_fkey";

-- AlterTable
ALTER TABLE "urls" DROP COLUMN "profile_id",
ADD COLUMN     "import_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "imports" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "imports" ADD CONSTRAINT "imports_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urls" ADD CONSTRAINT "urls_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

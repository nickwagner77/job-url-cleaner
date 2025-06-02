-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urls" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "cleaned_url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_name_key" ON "profiles"("name");

-- AddForeignKey
ALTER TABLE "urls" ADD CONSTRAINT "urls_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

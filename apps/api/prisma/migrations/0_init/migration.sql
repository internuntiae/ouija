-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "test_table" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "test_table_pkey" PRIMARY KEY ("id")
);


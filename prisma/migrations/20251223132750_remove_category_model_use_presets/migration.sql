/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the new category column with a temporary default
ALTER TABLE "Transaction" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Shopping';

-- Step 2: Migrate existing data - copy category names from the Category table
UPDATE "Transaction" 
SET "category" = "Category"."name"
FROM "Category"
WHERE "Transaction"."categoryId" = "Category"."id";

-- Step 3: Drop the foreign key constraints
ALTER TABLE "Category" DROP CONSTRAINT "Category_userId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";

-- Step 4: Drop the old categoryId column
ALTER TABLE "Transaction" DROP COLUMN "categoryId";

-- Step 5: Drop the Category table
DROP TABLE "Category";
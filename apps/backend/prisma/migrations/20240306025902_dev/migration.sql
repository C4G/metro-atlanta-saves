/*
  Warnings:

  - You are about to drop the `UsersOnRoles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Administrator', 'United_Way_Staff', 'Partner_Staff');

-- DropForeignKey
ALTER TABLE "UsersOnRoles" DROP CONSTRAINT "UsersOnRoles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UsersOnRoles" DROP CONSTRAINT "UsersOnRoles_userId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "roles" "Role"[];

-- DropTable
DROP TABLE "UsersOnRoles";

-- DropTable
DROP TABLE "roles";

/*
  Warnings:

  - You are about to drop the `chat_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chat_users" DROP CONSTRAINT "chat_users_chatId_fkey";

-- DropForeignKey
ALTER TABLE "chat_users" DROP CONSTRAINT "chat_users_userId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_chatId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_userId_fkey";

-- DropTable
DROP TABLE "chat_users";

-- DropTable
DROP TABLE "chats";

-- DropTable
DROP TABLE "messages";

-- DropEnum
DROP TYPE "ChatType";

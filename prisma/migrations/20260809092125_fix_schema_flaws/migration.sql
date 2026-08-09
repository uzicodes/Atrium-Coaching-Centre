/*
  Warnings:

  - You are about to alter the column `credits_charged` on the `enrolment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `credits_refunded` on the `enrolment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `credits` on the `person` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `room_fee_credits` on the `session` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `seat_fee_credits` on the `session` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - A unique constraint covering the columns `[person_id,session_id]` on the table `enrolment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `person` will be added. If there are existing duplicate values, this will fail.
  - Made the column `enrolment_id` on table `check_in` required. This step will fail if there are existing NULL values in that column.
  - Made the column `checked_in_at` on table `check_in` required. This step will fail if there are existing NULL values in that column.
  - Made the column `session_id` on table `enrolment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `person_id` on table `enrolment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `enrolment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `credits_charged` on table `enrolment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `credits_refunded` on table `enrolment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enrolled_at` on table `enrolment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password_hash` on table `person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `full_name` on table `person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `kind` on table `person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `credits` on table `person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `person` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `room` required. This step will fail if there are existing NULL values in that column.
  - Made the column `capacity` on table `room` required. This step will fail if there are existing NULL values in that column.
  - Made the column `room_id` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `coach_id` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discipline` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `session_type` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `starts_at` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ends_at` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `room_fee_credits` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `seat_fee_credits` on table `session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `session` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "check_in" DROP CONSTRAINT "check_in_enrolment_id_fkey";

-- DropForeignKey
ALTER TABLE "enrolment" DROP CONSTRAINT "enrolment_person_id_fkey";

-- DropForeignKey
ALTER TABLE "enrolment" DROP CONSTRAINT "enrolment_session_id_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_coach_id_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_room_id_fkey";

-- DropIndex
DROP INDEX "idx_session_created_discipline_status";

-- AlterTable
ALTER TABLE "check_in" ALTER COLUMN "enrolment_id" SET NOT NULL,
ALTER COLUMN "checked_in_at" SET NOT NULL,
ALTER COLUMN "checked_in_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "enrolment" ALTER COLUMN "session_id" SET NOT NULL,
ALTER COLUMN "person_id" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "credits_charged" SET NOT NULL,
ALTER COLUMN "credits_charged" SET DATA TYPE INTEGER,
ALTER COLUMN "credits_refunded" SET NOT NULL,
ALTER COLUMN "credits_refunded" SET DEFAULT 0,
ALTER COLUMN "credits_refunded" SET DATA TYPE INTEGER,
ALTER COLUMN "enrolled_at" SET NOT NULL,
ALTER COLUMN "enrolled_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "person" ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "password_hash" SET NOT NULL,
ALTER COLUMN "full_name" SET NOT NULL,
ALTER COLUMN "kind" SET NOT NULL,
ALTER COLUMN "credits" SET NOT NULL,
ALTER COLUMN "credits" SET DEFAULT 0,
ALTER COLUMN "credits" SET DATA TYPE INTEGER,
ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "room" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "capacity" SET NOT NULL;

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "room_id" SET NOT NULL,
ALTER COLUMN "coach_id" SET NOT NULL,
ALTER COLUMN "discipline" SET NOT NULL,
ALTER COLUMN "session_type" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "starts_at" SET NOT NULL,
ALTER COLUMN "ends_at" SET NOT NULL,
ALTER COLUMN "room_fee_credits" SET NOT NULL,
ALTER COLUMN "room_fee_credits" SET DATA TYPE INTEGER,
ALTER COLUMN "seat_fee_credits" SET NOT NULL,
ALTER COLUMN "seat_fee_credits" SET DATA TYPE INTEGER,
ALTER COLUMN "created_at" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "enrolment_person_id_session_id_key" ON "enrolment"("person_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_email_key" ON "person"("email");

-- CreateIndex
CREATE INDEX "session_starts_at_ends_at_room_id_idx" ON "session"("starts_at", "ends_at", "room_id");

-- AddForeignKey
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_enrolment_id_fkey" FOREIGN KEY ("enrolment_id") REFERENCES "enrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrolment" ADD CONSTRAINT "enrolment_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrolment" ADD CONSTRAINT "enrolment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

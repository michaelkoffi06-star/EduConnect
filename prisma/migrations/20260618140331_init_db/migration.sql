-- CreateEnum
CREATE TYPE "InstructorType" AS ENUM ('ETUDIANT', 'PROF_COLLEGE', 'PROF_LYCEE');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AcademicLevel" AS ENUM ('COLLEGE', 'LYCEE', 'ALL');

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" "InstructorType" NOT NULL DEFAULT 'ETUDIANT',
    "status" "ProfileStatus" NOT NULL DEFAULT 'PENDING',
    "levels" "AcademicLevel" NOT NULL DEFAULT 'ALL',
    "bio" TEXT,
    "photoUrl" TEXT,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorSubject" (
    "instructorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "InstructorSubject_pkey" PRIMARY KEY ("instructorId","subjectId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");

-- AddForeignKey
ALTER TABLE "InstructorSubject" ADD CONSTRAINT "InstructorSubject_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorSubject" ADD CONSTRAINT "InstructorSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

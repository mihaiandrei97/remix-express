-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "blob" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Media" ADD COLUMN "category" TEXT;
ALTER TABLE "Media" ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MediaTag" (
    "id" TEXT NOT NULL,
    "mediaHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumMedia" (
    "albumId" TEXT NOT NULL,
    "mediaHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlbumMedia_pkey" PRIMARY KEY ("albumId","mediaHash")
);

-- CreateIndex
CREATE INDEX "Media_favorite_idx" ON "Media"("favorite");
CREATE INDEX "Media_category_idx" ON "Media"("category");
CREATE UNIQUE INDEX "MediaTag_mediaHash_name_key" ON "MediaTag"("mediaHash", "name");
CREATE INDEX "MediaTag_name_idx" ON "MediaTag"("name");
CREATE UNIQUE INDEX "Album_name_key" ON "Album"("name");
CREATE INDEX "AlbumMedia_mediaHash_idx" ON "AlbumMedia"("mediaHash");

-- AddForeignKey
ALTER TABLE "MediaTag" ADD CONSTRAINT "MediaTag_mediaHash_fkey"
FOREIGN KEY ("mediaHash") REFERENCES "Media"("fileHash") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlbumMedia" ADD CONSTRAINT "AlbumMedia_albumId_fkey"
FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlbumMedia" ADD CONSTRAINT "AlbumMedia_mediaHash_fkey"
FOREIGN KEY ("mediaHash") REFERENCES "Media"("fileHash") ON DELETE CASCADE ON UPDATE CASCADE;

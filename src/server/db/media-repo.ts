import type {
  Prisma,
} from "../../generated/prisma/client.js";
import { Prisma as PrismaNamespace } from "../../generated/prisma/client.js";
import type { JsonObject } from "../types.js";
import { sanitizeText } from "../text.js";
import { getPrisma } from "./prisma.js";

export interface CreateMediaInput {
  fileHash: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: bigint;
  width: number;
  height: number;
  dhash64: string;
  phash64: string;
  title: string | null;
  description: string | null;
  exif: JsonObject | null;
  capturedAt: Date;
}

export interface CreateMediaResult {
  media: MediaWithPaths;
  created: boolean;
}

export const MEDIA_INCLUDE = {
  paths: true,
  tags: true,
  albums: { include: { album: true } },
} satisfies Prisma.MediaInclude;

export type MediaWithPaths = Prisma.MediaGetPayload<{ include: typeof MEDIA_INCLUDE }>;

export interface PerceptualHashRecord {
  fileHash: string;
  filePath: string;
  fileName: string;
  dhash64: string | null;
  phash64: string | null;
}

export async function findByFileHash(fileHash: string): Promise<MediaWithPaths | null> {
  const prisma = await getPrisma();
  return prisma.media.findUnique({
    where: { fileHash },
    include: MEDIA_INCLUDE,
  });
}

export async function create(input: CreateMediaInput): Promise<CreateMediaResult> {
  const prisma = await getPrisma();
  const data: Prisma.MediaCreateInput = {
    fileHash: input.fileHash,
    filePath: sanitizeText(input.filePath),
    fileName: sanitizeText(input.fileName),
    mimeType: sanitizeText(input.mimeType),
    sizeBytes: input.sizeBytes,
    width: input.width,
    height: input.height,
    dhash64: input.dhash64,
    phash64: input.phash64,
    title: input.title === null ? null : sanitizeText(input.title),
    description: input.description === null ? null : sanitizeText(input.description),
    exif: input.exif ?? PrismaNamespace.DbNull,
    capturedAt: input.capturedAt,
    paths: {
      create: {
        filePath: input.filePath,
        fileName: input.fileName,
      },
    },
  };

  try {
    return {
      media: await prisma.media.create({ data, include: MEDIA_INCLUDE }),
      created: true,
    };
  } catch (error) {
    if (
      !(error instanceof PrismaNamespace.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    const existing = await findByFileHash(input.fileHash);
    if (!existing) {
      throw error;
    }

    return {
      media: existing,
      created: false,
    };
  }
}

export async function listPerceptualHashes(): Promise<PerceptualHashRecord[]> {
  const prisma = await getPrisma();
  return prisma.media.findMany({
    select: {
      fileHash: true,
      filePath: true,
      fileName: true,
      dhash64: true,
      phash64: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function count(): Promise<number> {
  const prisma = await getPrisma();
  return prisma.media.count();
}


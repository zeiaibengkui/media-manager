import type { MediaPatchRequest } from "../../shared/api-types.js";
import { sanitizeText } from "../text.js";
import { findByFileHash } from "./media-repo.js";
import type { MediaWithPaths } from "./media-repo.js";
import { getPrisma } from "./prisma.js";

export async function updateMediaMetadata(
  fileHash: string,
  patch: Pick<MediaPatchRequest, "favorite" | "category" | "tags">,
): Promise<MediaWithPaths> {
  const prisma = await getPrisma();
  await prisma.media.update({
    where: { fileHash },
    data: {
      ...(patch.favorite === undefined ? {} : { favorite: patch.favorite }),
      ...(patch.category === undefined
        ? {}
        : {
            category: patch.category === null
              ? null
              : sanitizeText(patch.category).trim() || null,
          }),
      ...(patch.tags === undefined
        ? {}
        : {
            tags: {
              deleteMany: {},
              create: patch.tags.map((name) => ({ name: sanitizeText(name).trim() })),
            },
          }),
    },
  });
  const media = await findByFileHash(fileHash);
  if (!media) throw new Error("Media record not found");
  return media;
}

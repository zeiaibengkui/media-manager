import type { MediaRecord } from "../../../../src/shared/api-types.js";

export interface MediaGroup {
  key: string;
  label: string;
  items: MediaRecord[];
}

function mediaDate(media: MediaRecord): Date {
  const captured = new Date(media.capturedAt);
  if (!Number.isNaN(captured.getTime())) return captured;
  const created = new Date(media.createdAt);
  return Number.isNaN(created.getTime()) ? new Date() : created;
}

export function filterMedia(items: MediaRecord[], query: string): MediaRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) =>
    item.fileName.toLowerCase().includes(normalized) ||
    item.filePath.toLowerCase().includes(normalized) ||
    item.category?.toLowerCase().includes(normalized) ||
    item.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
    item.albums.some((album) => album.name.toLowerCase().includes(normalized)) ||
    item.title?.toLowerCase().includes(normalized) ||
    item.description?.toLowerCase().includes(normalized),
  );
}

export function groupByMonth(items: MediaRecord[]): MediaGroup[] {
  const groups = new Map<string, MediaGroup>();
  for (const item of items) {
    const date = mediaDate(item);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const group = groups.get(key);
    if (group) group.items.push(item);
    else {
      groups.set(key, {
        key,
        label: new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date),
        items: [item],
      });
    }
  }
  return [...groups.values()].sort((left, right) =>
    mediaDate(right.items[0] as MediaRecord).getTime() -
    mediaDate(left.items[0] as MediaRecord).getTime(),
  );
}

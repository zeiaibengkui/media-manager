import type { MediaRecord } from "../../../../src/shared/api-types.js";

const GAP = 4;
const ITERATIONS = 1400;
const ALPHA = 0.995;
const START_TEMPERATURE = 0.08;

export interface JustifiedRow {
  items: MediaRecord[];
  height: number;
  widths: number[];
  full: boolean;
}

function aspect(item: MediaRecord): number {
  return item.width > 0 && item.height > 0 ? item.width / item.height : 1;
}

function decode(
  order: MediaRecord[],
  containerWidth: number,
  targetHeight: number,
): JustifiedRow[] {
  const rows: JustifiedRow[] = [];
  let current: MediaRecord[] = [];
  let aspectSum = 0;

  for (const item of order) {
    current.push(item);
    aspectSum += aspect(item);
    const height = (containerWidth - GAP * (current.length - 1)) / aspectSum;
    if (height <= targetHeight) {
      rows.push({
        items: current,
        height,
        widths: current.map((entry) => height * aspect(entry)),
        full: true,
      });
      current = [];
      aspectSum = 0;
    }
  }

  if (current.length) {
    rows.push({
      items: current,
      height: targetHeight,
      widths: current.map((entry) => targetHeight * aspect(entry)),
      full: false,
    });
  }
  return rows;
}

function energy(
  order: MediaRecord[],
  containerWidth: number,
  targetHeight: number,
): number {
  const rows = decode(order, containerWidth, targetHeight);
  const fullRows = rows.filter((row) => row.full);
  const heightDeviation = fullRows.length
    ? fullRows.reduce((total, row) => total + Math.abs(row.height - targetHeight) / targetHeight, 0) /
      fullRows.length
    : 0;
  const last = rows.at(-1);
  const lastGap = last && !last.full
    ? Math.max(0, 1 - (last.widths.reduce((total, width) => total + width, 0) + GAP * (last.items.length - 1)) / containerWidth)
    : 0;
  const times = order.map((item) => new Date(item.createdAt).getTime());
  let timeGap = 0;
  for (let index = 1; index < times.length; index += 1) {
    timeGap += Math.abs((times[index] ?? 0) - (times[index - 1] ?? 0));
  }
  const timeSpan = Math.max(1, (Math.max(...times) - Math.min(...times)) * Math.max(1, times.length - 1));
  return 0.45 * heightDeviation + 0.25 * lastGap + 0.30 * (timeGap / timeSpan);
}

function hashSeed(items: MediaRecord[], targetHeight: number): number {
  const text = `${targetHeight}:${items.map((item) => item.fileHash).join(":")}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFactory(seed: number): () => number {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function neighbor(order: MediaRecord[], random: () => number): MediaRecord[] {
  const next = [...order];
  const first = Math.floor(random() * next.length);
  const second = Math.floor(random() * next.length);
  const kind = random();
  if (kind < 0.5) {
    [next[first], next[second]] = [next[second] as MediaRecord, next[first] as MediaRecord];
  } else if (kind < 0.8) {
    const [item] = next.splice(first, 1);
    next.splice(second, 0, item as MediaRecord);
  } else {
    let left = Math.min(first, second);
    let right = Math.max(first, second);
    while (left < right) {
      [next[left], next[right]] = [next[right] as MediaRecord, next[left] as MediaRecord];
      left += 1;
      right -= 1;
    }
  }
  return next;
}

export function buildJustifiedLayout(
  items: MediaRecord[],
  containerWidth: number,
  targetHeight: number,
): JustifiedRow[] {
  if (containerWidth <= 0 || items.length === 0) return [];
  let current = [...items];
  let currentCost = energy(current, containerWidth, targetHeight);
  let best = current;
  let bestCost = currentCost;
  let temperature = START_TEMPERATURE;
  const random = randomFactory(hashSeed(items, targetHeight));

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    const candidate = neighbor(current, random);
    const candidateCost = energy(candidate, containerWidth, targetHeight);
    if (candidateCost < currentCost || random() < Math.exp((currentCost - candidateCost) / temperature)) {
      current = candidate;
      currentCost = candidateCost;
      if (candidateCost < bestCost) {
        best = candidate;
        bestCost = candidateCost;
      }
    }
    temperature *= ALPHA;
  }
  return decode(best, containerWidth, targetHeight);
}

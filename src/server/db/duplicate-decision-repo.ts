import { getPrisma } from "./prisma.js";

export type DuplicateDecision = "keep-both" | "removed";

export function canonicalHashes(leftHash: string, rightHash: string): [string, string] {
  return leftHash < rightHash ? [leftHash, rightHash] : [rightHash, leftHash];
}

export async function listDecisions(): Promise<Set<string>> {
  const prisma = await getPrisma();
  const rows = await prisma.duplicateDecision.findMany({
    select: { leftHash: true, rightHash: true },
  });
  return new Set(rows.map((row) => `${row.leftHash}:${row.rightHash}`));
}

export async function saveDecision(
  leftHash: string,
  rightHash: string,
  decision: DuplicateDecision,
): Promise<void> {
  const prisma = await getPrisma();
  const [left, right] = canonicalHashes(leftHash, rightHash);
  await prisma.duplicateDecision.upsert({
    where: { leftHash_rightHash: { leftHash: left, rightHash: right } },
    create: { leftHash: left, rightHash: right, decision },
    update: { decision },
  });
}

export function decisionKey(leftHash: string, rightHash: string): string {
  return canonicalHashes(leftHash, rightHash).join(":");
}

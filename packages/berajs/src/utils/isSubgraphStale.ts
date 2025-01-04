import { FALLBACK_BLOCK_TIME } from "@bera/config";

export function isSubgraphStale(lastBlockTimestamp: number | null | undefined) {
  if (!lastBlockTimestamp) return true;
  return lastBlockTimestamp < Date.now() / 1000 - FALLBACK_BLOCK_TIME * 10;
}

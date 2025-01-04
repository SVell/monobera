import { FALLBACK_BLOCK_TIME } from "@bera/config";
import useSWRImmutable from "swr/immutable";
import { useBlockNumber, usePublicClient } from "wagmi";

import { useBlockTime } from "..";

/**
 *
 * @returns Timestamp in seconds
 */
export const useBlockToTimestamp = (
  inputBlock: number | bigint | string,
): number | undefined => {
  const publicClient = usePublicClient();
  const { data: currentBlock, isLoading } = useBlockNumber({
    cacheTime: FALLBACK_BLOCK_TIME * 1000,
  });

  const { data: block } = useSWRImmutable(
    currentBlock &&
      inputBlock &&
      Number(currentBlock) > Number(inputBlock) &&
      publicClient
      ? ["blockData", inputBlock]
      : null,
    async () => {
      if (!inputBlock) {
        throw new Error("No block number provided");
      }
      return publicClient!.getBlock({
        blockNumber: BigInt(inputBlock),
        includeTransactions: false,
      });
    },
  );

  const blockDuration = useBlockTime();

  if (block) {
    return Number(block.timestamp);
  }

  if (isLoading || !currentBlock) return undefined;

  return (
    Date.now() / 1000 +
    blockDuration * (Number(inputBlock) - Number(currentBlock))
  );
};

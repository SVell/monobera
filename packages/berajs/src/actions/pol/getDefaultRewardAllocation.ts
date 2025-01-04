import { beraChefAddress } from "@bera/config";
import { PublicClient } from "viem";

import { BERA_CHEF_ABI } from "~/abi";
import { BeraConfig } from "~/types";

export interface DefaultRewardAllocation {
  startBlock: bigint;
  weights: readonly { receiver: `0x${string}`; percentageNumerator: bigint }[];
}

export const getDefaultRewardAllocation = async ({
  client,
  config,
}: {
  client: PublicClient;
  config: BeraConfig;
}): Promise<DefaultRewardAllocation | undefined> => {
  try {
    if (!beraChefAddress)
      throw new Error("missing contract address beraChefAddress");

    const result = await client.readContract({
      address: beraChefAddress,
      abi: BERA_CHEF_ABI,
      functionName: "getDefaultRewardAllocation",
      args: [],
    });
    return result;
  } catch (e) {
    console.log("getRewardAllocationBlockDelay:", e);
    throw e;
  }
};

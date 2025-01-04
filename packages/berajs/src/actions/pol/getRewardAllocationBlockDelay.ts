import { PublicClient } from "viem";
import { beraChefAddress } from "@bera/config";
import { BERA_CHEF_ABI } from "~/abi";
import { BeraConfig } from "~/types";

export const getRewardAllocationBlockDelay = async ({
  client,
  config,
}: {
  client: PublicClient;
  config: BeraConfig;
}): Promise<bigint | undefined> => {
  try {
    if (!beraChefAddress)
      throw new Error("missing contract address beraChefAddress");

    const result = await client.readContract({
      address: beraChefAddress,
      abi: BERA_CHEF_ABI,
      functionName: "rewardAllocationBlockDelay",
      args: [],
    });
    return result;
  } catch (e) {
    console.log("getRewardAllocationBlockDelay:", e);
    throw e;
  }
};

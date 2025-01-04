import { Address, PublicClient } from "viem";
import { beraChefAddress } from "@bera/config";
import { BERA_CHEF_ABI } from "~/abi";
import { BeraConfig } from "~/types";

export interface ValidatorRewardAllocation {
  startBlock: bigint;
  weights: readonly {
    receiver: `0x${string}`;
    percentageNumerator: bigint;
  }[];
}

export const getValidatorRewardAllocation = async ({
  client,
  config,
  pubKey,
}: {
  client: PublicClient;
  config: BeraConfig;
  pubKey: Address;
}): Promise<ValidatorRewardAllocation | undefined> => {
  try {
    if (!beraChefAddress)
      throw new Error("missing contract address beraChefAddress");

    const result = await client.readContract({
      address: beraChefAddress,
      abi: BERA_CHEF_ABI,
      functionName: "getActiveRewardAllocation",
      args: [pubKey],
    });
    return result;
  } catch (e) {
    console.log("getValidatorRewardAllocation:", e);
    throw e;
  }
};

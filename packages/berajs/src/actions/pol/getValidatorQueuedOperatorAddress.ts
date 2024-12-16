import { Address, PublicClient } from "viem";
import { depositContractAddress } from "@bera/config";
import { beaconDepositAbi } from "~/abi";
import { BeraConfig } from "~/types";

export type ValidatorQueuedOperatorAddress = [bigint, string];

export const getValidatorQueuedOperatorAddress = async ({
  client,
  config,
  pubKey,
}: {
  client: PublicClient;
  config: BeraConfig;
  pubKey: Address;
}): Promise<ValidatorQueuedOperatorAddress | undefined> => {
  try {
    if (!depositContractAddress)
      throw new Error("missing contract address depositContractAddress");

    const result = await client.readContract({
      address: depositContractAddress,
      abi: beaconDepositAbi,
      functionName: "queuedOperator",
      args: [pubKey],
    });
    return result as ValidatorQueuedOperatorAddress;
  } catch (e) {
    console.log("getValidatorQueuedOperatorAddress:", e);
    throw e;
  }
};

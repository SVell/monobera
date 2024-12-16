import { Address, PublicClient } from "viem";
import { depositContractAddress } from "@bera/config";
import { beaconDepositAbi } from "~/abi";
import { BeraConfig } from "~/types";

export type ValidatorOperatorAddress = Address;

export const getValidatorOperatorAddress = async ({
  client,
  config,
  pubKey,
}: {
  client: PublicClient;
  config: BeraConfig;
  pubKey: Address;
}): Promise<ValidatorOperatorAddress | undefined> => {
  try {
    if (!depositContractAddress)
      throw new Error("missing contract address depositContractAddress");

    const result = await client.readContract({
      address: depositContractAddress,
      abi: beaconDepositAbi,
      functionName: "getOperator",
      args: [pubKey],
    });
    return result as ValidatorOperatorAddress;
  } catch (e) {
    console.log("getValidatorOperatorAddress:", e);
    throw e;
  }
};

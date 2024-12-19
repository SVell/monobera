import { PublicClient } from "viem";

import { Address } from "viem";
import { BeraConfig } from "~/types";
import { honeyFactoryAbi } from "~/abi";
import { getHoneyCollaterals } from "~/actions/honey";

/**
 * Arguments for the getCollateralWeights function.
 */
interface getCollateralWeightsArgs {
  client: PublicClient;
  config: BeraConfig;
}

/**
 * Fetches the weights of collaterals from the honey factory contract.
 * and returns a record of collateral addresses and their weights.
 *
 * @param {getCollateralWeightsArgs} args - The arguments for the function.
 * @returns {Promise<Record<Address, bigint> | undefined>} A promise that resolves to a record of collateral addresses and their weights, or undefined if an error occurs.
 */
export const getCollateralWeights = async ({
  client,
  config,
}: getCollateralWeightsArgs): Promise<Record<Address, bigint> | undefined> => {
  try {
    if (!config.contracts?.honeyFactoryAddress)
      throw new Error("missing contract address honeyFactoryAddress");

    const collateralList = await getHoneyCollaterals({
      client: client,
      config,
    });

    // Fetch the weights for all collateral assets
    const collateralWeights = await client.readContract({
      address: config.contracts!.honeyFactoryAddress,
      abi: honeyFactoryAbi,
      functionName: "getWeights",
    });

    // Combine the addresses and weights into a single object
    // where each address maps to its corresponding weight
    const weightsWithAddress: Record<Address, bigint> = collateralList.reduce(
      (agg, key, idx) => Object.assign(agg, { [key]: collateralWeights[idx] }),
      {},
    );

    return weightsWithAddress;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

import { Address, PublicClient } from "viem";

import { honeyFactoryAbi } from "~/abi";
import { BeraConfig } from "~/types/global";

export interface isBadCollateralArgs {
  client: PublicClient;
  config: BeraConfig;
  collateral: Address;
}

export interface isBadCollateralResponse {
  isBlacklisted: boolean;
  isDepegged: boolean;
}

/**
 * Checks if a given collateral asset is considered bad, either by being blacklisted or depegged.
 *
 * @param {Object} args - The arguments object.
 * @param {PublicClient} args.client - The client used to interact with the blockchain.
 * @param {BeraConfig} args.config - The configuration object containing contract addresses.
 * @param {Address} args.collateral - The address of the collateral asset to check.
 *
 * @returns {Promise<isBadCollateralResponse | undefined>} An object indicating if the collateral is blacklisted or depegged.
 *
 * @throws Will throw an error if the honeyFactoryAddress is missing in the config.
 */
export const isBadCollateralAsset = async ({
  client,
  config,
  collateral,
}: isBadCollateralArgs): Promise<isBadCollateralResponse | undefined> => {
  try {
    if (!config.contracts?.honeyFactoryAddress)
      throw new Error("missing contract address honeyFactoryAddress");

    // Check if the collateral is bad = blacklisted
    const badCollateralResult = await client.readContract({
      address: config.contracts!.honeyFactoryAddress,
      abi: honeyFactoryAbi,
      functionName: "isBadCollateralAsset",
      args: [collateral],
    });

    // check if the collateral is depegged
    const isDepeggedResult = !(await client.readContract({
      address: config.contracts!.honeyFactoryAddress,
      abi: honeyFactoryAbi,
      functionName: "isPegged",
      args: [collateral],
    }));

    return {
      isBlacklisted: badCollateralResult,
      isDepegged: isDepeggedResult,
    };
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

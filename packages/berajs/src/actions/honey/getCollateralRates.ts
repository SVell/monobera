import { Address, PublicClient, formatUnits } from "viem";

import { honeyFactoryAbi } from "~/abi";
import { BeraConfig } from "~/types/global";

export interface CollateralRates {
  mintFee: number;
  redeemFee: number;
}

export interface CollateralRatesMap {
  single: {
    [key: Address]: CollateralRates;
  };
  basket: CollateralRates;
}

export interface collateralRatesArgs {
  client: PublicClient;
  config: BeraConfig;
  collateralList: Address[];
}

/**
 * Fetches the mint and redeem rates for all collateral tokens and calculates the weighted basket rates
 * @param {Object} params - The parameters object
 * @param {PublicClient} params.client - The Viem public client instance
 * @param {BeraConfig} params.config - The Bera configuration object containing contract addresses
 * @param {Address[]} params.collateralList - Array of collateral token addresses
 * @returns {Promise<CollateralRatesMap | undefined>} Object containing individual collateral rates and weighted basket rates,
 * or undefined if the operation fails
 * @throws {Error} When honeyFactoryAddress is missing from the config
 */
export const getCollateralRates = async ({
  client,
  config,
  collateralList,
}: collateralRatesArgs): Promise<CollateralRatesMap | undefined> => {
  try {
    if (!config.contracts?.honeyFactoryAddress)
      throw new Error("missing contract address honeyFactoryAddress");

    // create a list for all the promises needed, fetch the mint and redeem rates for each collateral token
    const promiseList: Record<"mint" | "redeem", Promise<bigint>[]> = {
      mint: [],
      redeem: [],
    };
    for (const coll of collateralList) {
      promiseList.mint.push(
        client.readContract({
          address: config.contracts.honeyFactoryAddress,
          abi: honeyFactoryAbi,
          functionName: "mintRates",
          args: [coll],
        }),
      );
      promiseList.redeem.push(
        client.readContract({
          address: config.contracts.honeyFactoryAddress,
          abi: honeyFactoryAbi,
          functionName: "redeemRates",
          args: [coll],
        }),
      );
    }
    const [mintRates, redeemRates] = await Promise.all([
      Promise.all(promiseList.mint),
      Promise.all(promiseList.redeem),
    ]);

    // fetch the collateral weights, needed to calculate the weighted basket rates
    const collateralWeights = await client.readContract({
      address: config.contracts!.honeyFactoryAddress,
      abi: honeyFactoryAbi,
      functionName: "getWeights",
    });

    // create the object to return, with the individual collateral rates and the weighted basket rates
    const collateralRates: CollateralRatesMap = {
      single: {},
      basket: { mintFee: 0, redeemFee: 0 },
    };

    // calculate the weighted basket rates and the single collateral rates
    let totalWeightedMintCollateralsFee = 0;
    let totalWeightedRedeemCollateralsFee = 0;
    for (const coll of collateralList) {
      const collIdx = collateralList.indexOf(coll);
      collateralRates.single[coll] = {
        mintFee: 1 - +formatUnits(mintRates[collIdx], 18),
        redeemFee: 1 - +formatUnits(redeemRates[collIdx], 18),
      };
      totalWeightedMintCollateralsFee +=
        collateralRates.single[coll].mintFee *
        +formatUnits(collateralWeights[collIdx], 18);
      totalWeightedRedeemCollateralsFee +=
        collateralRates.single[coll].redeemFee *
        +formatUnits(collateralWeights[collIdx], 18);
    }

    // set the weighted basket rates
    collateralRates.basket = {
      mintFee: Number(totalWeightedMintCollateralsFee),
      redeemFee: Number(totalWeightedRedeemCollateralsFee),
    };

    return collateralRates;
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

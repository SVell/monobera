import { Token } from "~/types";
import { Address, PublicClient } from "viem";
import { honeyFactoryAbi } from "~/abi/honey/honeyFactory";
import { BeraConfig } from "~/types/global";

interface getHoneyCollateralsArgs {
  client: PublicClient;
  config: BeraConfig;
}

/**
 * Return the list of collateral addresses for the honey factory directly from the contract
 * @param {getHoneyCollateralsArgs} param0 - The arguments containing client and config
 * @returns {Promise<Address[]>} A promise that resolves to an array of collateral token addresses
 */
export const getHoneyCollaterals = async ({
  client,
  config,
}: getHoneyCollateralsArgs): Promise<Address[]> => {
  if (!config.contracts?.honeyFactoryAddress)
    throw new Error("missing contract address honeyFactoryAddress");

  // Get the total number of registered collateral assets
  const amountOfCollaterals = await client.readContract({
    address: config.contracts!.honeyFactoryAddress,
    abi: honeyFactoryAbi,
    functionName: "numRegisteredAssets",
  });

  // Create an array of promises to fetch each registered asset's address
  const promiseList: Promise<Address>[] = [];
  for (let i = 0; i < amountOfCollaterals; i++) {
    promiseList.push(
      client.readContract({
        address: config.contracts!.honeyFactoryAddress,
        abi: honeyFactoryAbi,
        functionName: "registeredAssets",
        args: [BigInt(i)],
      }),
    );
  }

  return await Promise.all(promiseList);
};

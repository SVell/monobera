import { GetPublicClientReturnType } from "@wagmi/core";
import { Address, PublicClient, erc20Abi } from "viem";

import { BeraConfig, Token } from "~/types";

export interface GetTokenInformation {
  address: Address;
  config: BeraConfig;
  publicClient: any;
}

export type GetTokenInformationResponse = Token | undefined;

export const getTokenInformation = async ({
  address,
  config,
  publicClient,
}: GetTokenInformation): Promise<GetTokenInformationResponse> => {
  try {
    if (!config.contracts?.multicallAddress) {
      throw new Error("Multicall address not found in config");
    }

    if (!publicClient) {
      throw new Error("Public client not found");
    }

    const [decimals, name, symbol] = await Promise.all([
      publicClient.readContract({
        address: address,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: address,
        abi: erc20Abi,
        functionName: "name",
      }),
      publicClient.readContract({
        address: address,
        abi: erc20Abi,
        functionName: "symbol",
      }),
    ]);

    const token = {
      address,
      decimals,
      name,
      symbol,
    };
    if (
      typeof token.decimals !== "number" ||
      typeof token.name !== "string" ||
      typeof token.symbol !== "string"
    )
      throw new Error(`Invalid ERC20 token. Address: ${address}`);
    return token as Token;
  } catch (e: any) {
    console.error(e);
    throw new Error(`Error fetching token information: ${e}`);
  }
};

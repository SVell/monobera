import { GetPublicClientReturnType } from "@wagmi/core";
import { Address, erc20Abi, formatUnits } from "viem";

import { BeraConfig, Token } from "~/types";

export interface GetStakingTokenInformation {
  address: Address;
  config: BeraConfig;
  publicClient: GetPublicClientReturnType;
  includeTotalSupply?: boolean;
}

export type GetStakingTokenInformationResponse = Partial<Token> | undefined;

export const getStakingTokenInformation = async ({
  address,
  config,
  publicClient,
}: GetStakingTokenInformation): Promise<GetStakingTokenInformationResponse> => {
  if (!config.contracts?.multicallAddress) {
    throw new Error("Multicall address not found in config");
  }

  if (!publicClient) {
    throw new Error("Public client not found");
  }

  const [decimals, name, symbol, totalSupply] = await publicClient.multicall({
    contracts: [
      {
        address: address,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: address,
        abi: erc20Abi,
        functionName: "name",
      },
      {
        address: address,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: address,
        abi: erc20Abi,
        functionName: "totalSupply",
      },
    ],
    allowFailure: true,
  });

  const token = {
    address: address,
    decimals: decimals.result,
    name: name.result,
    symbol: symbol.result,
    totalSupply: totalSupply.result
      ? decimals.status === "success"
        ? formatUnits(totalSupply.result, decimals.result)
        : totalSupply.result.toString()
      : undefined,
  };

  return token;
};

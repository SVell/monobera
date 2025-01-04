import { balancerApiChainName } from "@bera/config";
import { bexApiGraphqlClient } from "@bera/graphql";
import {
  GetTokenCurrentPricesDocument,
  GetTokenCurrentPricesQuery,
  GetTokenCurrentPricesQueryVariables,
  GqlChain,
} from "@bera/graphql/dex/api";
import { getAddress } from "viem";

import { getSafeNumber, handleNativeBera } from "~/utils";

interface TokenPriceInfo {
  price: number;
  chain: string;
  updatedAt: number;
}
export type TokenCurrentPriceMap = Record<string, TokenPriceInfo>;

export const getTokenCurrentPrices = async (): Promise<
  TokenCurrentPriceMap | undefined
> => {
  try {
    const res = await bexApiGraphqlClient.query<
      GetTokenCurrentPricesQuery,
      GetTokenCurrentPricesQueryVariables
    >({
      query: GetTokenCurrentPricesDocument,
      variables: {
        chains: [balancerApiChainName as GqlChain],
      },
    });

    const tokenCurrentPriceMap: TokenCurrentPriceMap =
      res.data?.tokenGetCurrentPrices.reduce<TokenCurrentPriceMap>(
        (map, tokenInformation) => {
          if (!tokenInformation.price || !tokenInformation.address) {
            return map;
          }

          const formattedAddress = getAddress(
            handleNativeBera(tokenInformation.address),
          ).toLowerCase();

          map[formattedAddress] = {
            price: getSafeNumber(tokenInformation.price.toString()),
            chain: tokenInformation.chain,
            updatedAt: tokenInformation.updatedAt,
          };

          return map;
        },
        {},
      ) || {};
    return tokenCurrentPriceMap;
  } catch (e) {
    console.error("Failed to fetch token prices:", e);
    throw e;
  }
};

import { bexSubgraphClient } from "@bera/graphql";
import {
  GetTokensDocument,
  GetTokensQuery,
  GetTokensQueryVariables,
} from "@bera/graphql/dex/subgraph";
import { getAddress } from "viem";

import type { BeraConfig } from "~/types";
import { getSafeNumber, handleNativeBera } from "~/utils";

interface FetchSubgraphTokenInformationsArgs {
  tokenAddresses?: string[] | undefined;
  config: BeraConfig;
}

export interface SubgraphTokenInformations {
  [key: string]: number; // aka Token.USDValue
}
/**
 * fetch the current honey prices of a series of tokens
 */

// NOTE: the name of this is a bit misleading, we dont return anything more than just the USD value of that token.
export const getSubgraphTokenInformations = async ({
  tokenAddresses,
  config,
}: FetchSubgraphTokenInformationsArgs): Promise<
  SubgraphTokenInformations | undefined
> => {
  if (!tokenAddresses || tokenAddresses.some((token) => token === undefined)) {
    return {};
  }

  const swappedAddresses = tokenAddresses.map((token: string | undefined) =>
    handleNativeBera(token).toLowerCase(),
  );

  try {
    const res = await bexSubgraphClient.query<
      GetTokensQuery,
      GetTokensQueryVariables
    >({
      query: GetTokensDocument,
      variables: {
        ids: swappedAddresses,
      },
    });

    return res.data?.tokens.reduce(
      (allPrices: SubgraphTokenInformations, tokenInformation) => {
        if (!tokenInformation.usdValue) return allPrices; // NOTE: we Skip tokens without a defined usdValue
        return {
          ...allPrices,
          [getAddress(tokenInformation.address)]: getSafeNumber(
            tokenInformation.usdValue,
          ),
        };
      },
      {},
    );
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

import { beraTokenAddress, bgtTokenAddress } from "@bera/config";
import { bexSubgraphClient } from "@bera/graphql";
import {
  GetToken,
  GetTokenQuery,
  GetTokenQueryVariables,
} from "@bera/graphql/dex/subgraph";
import { Address } from "viem";

import { Token } from "~/types";
import { BeraConfig } from "~/types/global";
import { handleNativeBera } from "~/utils";

interface FetchSubgraphTokenInformationArgs {
  tokenAddress?: string | undefined;
  config: BeraConfig;
}

/**
 * fetch the current honey price of a given token
 */

export const getSubgraphTokenInformation = async ({
  tokenAddress,
  config,
}: FetchSubgraphTokenInformationArgs): Promise<Token | undefined> => {
  if (!tokenAddress) {
    return undefined;
  }
  const res = await bexSubgraphClient.query<
    GetTokenQuery,
    GetTokenQueryVariables
  >({
    query: GetToken,
    variables: {
      id:
        handleNativeBera(tokenAddress as Address).toLowerCase() ===
        bgtTokenAddress.toLowerCase()
          ? beraTokenAddress.toLowerCase()
          : handleNativeBera(tokenAddress as Address).toLowerCase(),
    },
  });
  return (res.data?.token as Token) ?? undefined;
};

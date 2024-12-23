import { bexSubgraphClient } from "@bera/graphql";
import {
  GetTokenInformations,
  GetTokenInformationsQuery,
} from "@bera/graphql/dex/subgraph";
import { honeyTokenAddress } from "@bera/config";

import { BeraConfig } from "~/types";
import { handleNativeBera } from "~/utils";
import { isSameAddress } from "@berachain-foundation/berancer-sdk";
import { Address } from "viem";

interface FetchHoneyPricesArgs {
  tokenAddresses?: string[] | undefined;
  config: BeraConfig;
}

export interface TokenHoneyPrices {
  [key: string]: string;
}
/**
 * fetch the current honey prices of a series of tokens
 */
export const getTokenHoneyPrices = async ({
  tokenAddresses,
  config,
}: FetchHoneyPricesArgs): Promise<TokenHoneyPrices | undefined> => {
  if (!tokenAddresses || tokenAddresses.some((token) => token === undefined)) {
    return {};
  }

  const swappedAddresses = tokenAddresses.map((token: string | undefined) =>
    handleNativeBera(token).toLowerCase(),
  );

  try {
    const res = await bexSubgraphClient.query<GetTokenInformationsQuery>({
      query: GetTokenInformations,
      variables: {
        pricingAsset: honeyTokenAddress,
        assets: swappedAddresses,
      },
    });

    const prices: TokenHoneyPrices = {};

    for (const tokenPrice of res.data?.tokenPrices || []) {
      if (Object.keys(prices).length === swappedAddresses.length) {
        break;
      }

      if (!Object.hasOwn(prices, tokenPrice.asset)) {
        prices[tokenPrice.asset] = tokenPrice.price;
      }
    }

    /**
     * We need the index so we are sure that in the prices map the address matches the input address
     *
     * e.g. lowercase addresses
     */
    const honeyIndex = tokenAddresses
      .map((t) => t.toLowerCase())
      .findIndex((t) => isSameAddress(t as Address, honeyTokenAddress));

    if (honeyIndex !== -1) {
      prices[tokenAddresses[honeyIndex]] = "1";
    }

    return prices;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

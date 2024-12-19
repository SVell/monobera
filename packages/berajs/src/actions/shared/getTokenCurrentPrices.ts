import { balancerApiChainName, balancerApiUrl } from "@bera/config";

// FIXME there is a serious issue with the apollo client and the way it's formatting the chain variable here. so I'm hardcoding this for now.

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
    const response = await fetch(balancerApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query:
          "query GetTokenCurrentPrices($chains: [GqlChain!]!) {\n  tokenGetCurrentPrices(chains: $chains) {\n    address\n    price\n    chain\n    updatedAt\n  }\n}\n",
        variables: {
          chains: ["CARTIO"],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);
      throw new Error("GraphQL query failed.");
    }

    const pricesArray = result.data.tokenGetCurrentPrices;

    if (!pricesArray || !Array.isArray(pricesArray)) {
      throw new Error("Unexpected response format.");
    }

    const tokenCurrentPriceMap: TokenCurrentPriceMap = pricesArray.reduce(
      (map, { address, ...info }: { address: string } & TokenPriceInfo) => {
        map[address] = info;
        return map;
      },
      {} as TokenCurrentPriceMap,
    );
    return tokenCurrentPriceMap;
  } catch (error) {
    console.error("Failed to fetch token prices:", error);
  }
};

// import { gql } from "@apollo/client";
// import { bexSubgraphClient } from "@bera/graphql";
// import {
//   GetTokenCurrentPrices,
//   GetTokenCurrentPricesDocument,
//   GetTokenCurrentPricesQuery,
//   GetTokenCurrentPricesQueryVariables,
//   GqlChain,
// } from "@bera/graphql/dex/api";
// import { getAddress } from "viem";

// import { getSafeNumber, handleNativeBera } from "~/utils";

// interface FetchCurrentTokenPricesArgs {
//     chains: GqlChain | GqlChain[];
//   }
// export interface CurrentTokenPrices {
//     [key: string]: number; // aka Token.USDValue
//   }
// export const getTokenCurrentPrices = async (): Promise<
//   CurrentTokenPrices | undefined
// > => {
//   try {
//     const res = await bexSubgraphClient.query<
//       GetTokenCurrentPricesQuery,
//       GetTokenCurrentPricesQueryVariables
//     >({
//       query: GetTokenCurrentPricesDocument,
//       variables: {
//         chains: [balancerApiChainName as GqlChain],
//       },
//     });

//     const results = res.data?.tokenGetCurrentPrices.reduce<CurrentTokenPrices>(
//       (allPrices, tokenInformation) => {
//         if (!tokenInformation.price) return allPrices; // Skip tokens without a price

//         const formattedAddress = getAddress(
//           handleNativeBera(tokenInformation.address).toLowerCase(),
//         );

//         return {
//           ...allPrices,
//           [formattedAddress]: getSafeNumber(tokenInformation.price.toString()),
//         };
//       },
//       {},
//     );
//     console.log("Token Prices:", results);
//   } catch (e) {
//     console.error("$$$$$ Failed to fetch token prices:", e);
//     return undefined;
//   }
// };

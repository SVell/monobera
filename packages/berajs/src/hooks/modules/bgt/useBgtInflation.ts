import { ApolloClient, InMemoryCache } from "@apollo/client";
import { beraTokenAddress, polSubgraphUrl } from "@bera/config";
import {
  GetWeeklyBgtInflation,
  GetWeeklyBgtInflationQuery,
  GetWeeklyBgtInflationQueryVariables,
} from "@bera/graphql/pol/subgraph";
import useSWR from "swr";

import { DefaultHookOptions, DefaultHookReturnType } from "~/types/global";

export interface BgtInflation {
  bgtPerYear: number;
  usdPerYear: number;
}

export const useBgtInflation = (
  options?: DefaultHookOptions,
): DefaultHookReturnType<BgtInflation | undefined> => {
  const QUERY_KEY = ["bgtInflation"];
  const swrResponse = useSWR<BgtInflation | undefined>(
    QUERY_KEY,
    async () => {
      const bgtClient = new ApolloClient({
        uri: polSubgraphUrl,
        cache: new InMemoryCache(),
      });
      return await bgtClient
        .query<GetWeeklyBgtInflationQuery, GetWeeklyBgtInflationQueryVariables>(
          {
            query: GetWeeklyBgtInflation,
            variables: {
              wbera: beraTokenAddress.toLowerCase(),
            },
          },
        )
        .then((res) => {
          const weeklyInflationArray = res.data.globalRewardDistributions.map(
            (usage) => usage.BGTDistributed,
          );
          const avgDailyInflation =
            calculateAverageInflation(weeklyInflationArray);
          const annualizedInflation =
            calculateAnnualizedInflation(avgDailyInflation);
          return {
            bgtPerYear: annualizedInflation,
            usdPerYear:
              annualizedInflation *
              // @ts-expect-error
              parseFloat(res.data.tokenInformation?.usdValue ?? "0"),
          };
        })
        .catch((e: any) => {
          console.log(e);
          return undefined;
        });
    },
    {
      ...options,
      refreshInterval: 0,
    },
  );

  return {
    ...swrResponse,
    refresh: () => swrResponse.mutate(),
  };
};

function calculateAverageInflation(inflationArray: string[]): number {
  if (inflationArray.length === 0) return 0;
  const sum = inflationArray.reduce(
    (acc, val: any) => acc + parseFloat(val.BGTDistributed),
    0,
  );
  return sum / inflationArray.length;
}

function calculateAnnualizedInflation(avgDailyInflation: number): number {
  return avgDailyInflation * 365;
}

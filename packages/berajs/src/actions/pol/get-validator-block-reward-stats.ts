import { bgtClient } from "@bera/graphql";
import {
  GetValidatorBlockRewardStats,
  GetValidatorBlockRewardStatsQueryVariables,
  type GetValidatorBlockRewardStatsQuery,
} from "@bera/graphql/pol/subgraph";
import { Address } from "viem";

import { type BeraConfig } from "~/types";
import { formatDaysToTimestamps } from "~/utils";

export const getValidatorBlockRewardStats = async ({
  config,
  address,
  daysRange,
}: {
  config: BeraConfig;
  address: Address;
  daysRange: number;
}): Promise<GetValidatorBlockRewardStatsQuery | undefined> => {
  try {
    if (!config.subgraphs?.polSubgraph) {
      throw new Error("pol subgraph uri is not found in config");
    }
    const result = await bgtClient.query<
      GetValidatorBlockRewardStatsQuery,
      GetValidatorBlockRewardStatsQueryVariables
    >({
      query: GetValidatorBlockRewardStats,
      variables: {
        address: address.toLowerCase(),
        timestamp: formatDaysToTimestamps(daysRange),
      },
    });
    return result.data;
  } catch (e) {
    console.error("GetValidatorBlockRewardStats:", e);
    return undefined;
  }
};

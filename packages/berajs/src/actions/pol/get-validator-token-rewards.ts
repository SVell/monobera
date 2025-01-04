import { bgtClient } from "@bera/graphql";
import {
  GetValidatorIncentivesReceiveds,
  type GetValidatorIncentivesReceivedsQuery,
} from "@bera/graphql/pol/subgraph";
import { Address } from "viem";

import { type BeraConfig } from "~/types";
import { formatDaysToTimestamps } from "~/utils";

export const getValidatorIncentivesReceiveds = async ({
  config,
  address,
  daysRange,
}: {
  config: BeraConfig;
  address: Address;
  daysRange: number;
}): Promise<GetValidatorIncentivesReceivedsQuery | undefined> => {
  try {
    if (!config.subgraphs?.polSubgraph) {
      throw new Error("pol subgraph uri is not found in config");
    }

    const result = await bgtClient.query<GetValidatorIncentivesReceivedsQuery>({
      query: GetValidatorIncentivesReceiveds,
      variables: {
        address: address.toLowerCase(),
        timestamp: formatDaysToTimestamps(daysRange),
      },
    });

    return result.data;
  } catch (e) {
    console.error("getValidatorIncentivesReceivedsQuery:", e);
    return undefined;
  }
};

import { bgtClient } from "@bera/graphql";
import {
  GetRewardVault,
  type GetRewardVaultQuery,
} from "@bera/graphql/pol/subgraph";
import { Address } from "viem";

import { type BeraConfig } from "~/types";

export const getRewardVault = async ({
  config,
  stakingToken,
}: {
  config: BeraConfig;
  stakingToken: Address | undefined;
}): Promise<GetRewardVaultQuery | undefined> => {
  try {
    if (!config.subgraphs?.polSubgraph) {
      throw new Error("pol subgraph uri is not found in config");
    }
    if (!stakingToken) {
      return undefined;
    }

    const result = await bgtClient.query<GetRewardVaultQuery>({
      query: GetRewardVault,
      variables: {
        stakingToken: stakingToken,
      },
    });

    return result.data;
  } catch (e) {
    console.error("getRewardVault:", e);
    return undefined;
  }
};

import { bgtClient } from "@bera/graphql";
import {
  GetValidatorBgtBoost,
  type GetValidatorBgtBoostQuery,
} from "@bera/graphql/pol/subgraph";
import { Address } from "viem";

import { type BeraConfig } from "~/types";

export const getValidatorBgtBoost = async ({
  config,
  address,
}: {
  config: BeraConfig;
  address: Address;
}): Promise<GetValidatorBgtBoostQuery | undefined> => {
  try {
    if (!config.subgraphs?.polSubgraph) {
      throw new Error("pol subgraph uri is not found in config");
    }

    const result = await bgtClient.query<GetValidatorBgtBoostQuery>({
      query: GetValidatorBgtBoost,
      variables: { address: address.toLowerCase() },
    });

    return result.data;
  } catch (e) {
    console.error("getValidatorBgtBoost:", e);
    return undefined;
  }
};

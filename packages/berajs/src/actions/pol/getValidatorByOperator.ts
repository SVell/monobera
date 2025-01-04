import { bgtClient } from "@bera/graphql";
import {
  GetValidatorByOperator,
  type GetValidatorByOperatorQuery,
} from "@bera/graphql/pol/subgraph";
import { Address } from "viem";

import { type BeraConfig } from "~/types";

export const getValidatorByOperator = async ({
  config,
  address,
}: {
  config: BeraConfig;
  address: Address;
}): Promise<GetValidatorByOperatorQuery | undefined> => {
  try {
    if (!config.subgraphs?.polSubgraph) {
      throw new Error("pol subgraph uri is not found in config");
    }
    const result = await bgtClient.query<GetValidatorByOperatorQuery>({
      query: GetValidatorByOperator,
      variables: { operator: address.toLowerCase() },
    });
    return result.data;
  } catch (e) {
    console.error("getValidatorByOperator:", e);
    throw e;
  }
};

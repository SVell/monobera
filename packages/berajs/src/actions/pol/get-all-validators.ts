import { bexApiGraphqlClient, bgtClient } from "@bera/graphql";
import {
  GetValidatorsDocument,
  GetValidatorsQueryVariables,
  type GetValidatorsQuery,
} from "@bera/graphql/pol/api";

import { type BeraConfig } from "~/types";

export const getAllValidators = async ({
  config,
  variables,
}: {
  config: BeraConfig;
  variables?: GetValidatorsQueryVariables;
}): Promise<GetValidatorsQuery | undefined> => {
  if (!config.subgraphs?.polSubgraph) {
    throw new Error("pol subgraph uri is not found in config");
  }

  const result = await bexApiGraphqlClient.query<
    GetValidatorsQuery,
    GetValidatorsQueryVariables
  >({
    query: GetValidatorsDocument,
    variables,
  });

  return result.data;
};

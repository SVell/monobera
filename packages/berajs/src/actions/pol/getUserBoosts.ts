import { bgtClient } from "@bera/graphql";
import {
  GetUserValidatorInformation,
  GetUserValidatorInformationQueryVariables,
  type GetUserValidatorInformationQuery,
} from "@bera/graphql/pol/subgraph";
import { BeraConfig } from "~/types";

export const getUserBoosts = async ({
  config,
  account,
}: {
  config: BeraConfig;
  account: string;
}) => {
  if (!config.subgraphs?.polSubgraph) {
    throw new Error("pol subgraph uri is not found in config");
  }

  // TODO: handle more than 1000 validators
  return await bgtClient.query<
    GetUserValidatorInformationQuery,
    GetUserValidatorInformationQueryVariables
  >({
    query: GetUserValidatorInformation,
    variables: { address: account.toLowerCase() },
  });
};

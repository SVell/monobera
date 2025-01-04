import { bgtClient } from "@bera/graphql";
import {
  GetUserValidatorInformation,
  GetUserValidatorInformationQuery,
  GetUserValidatorInformationQueryVariables,
} from "@bera/graphql/pol/subgraph";
import useSWR from "swr";
import { Address } from "viem";

import { useBeraJs } from "~/contexts";

export const useSubgraphUserValidators = ({
  account: _account,
}: {
  account?: Address;
} = {}) => {
  const { account } = useBeraJs();

  const queriedAccount = _account ?? account;
  const QUERY_KEY = queriedAccount
    ? ["useSubgraphUserValidators", queriedAccount]
    : null;
  return useSWR(QUERY_KEY, async () => {
    if (!account) {
      throw new Error("useSubgraphUserValidators needs a logged in account");
    }

    const { data } = await bgtClient.query<
      GetUserValidatorInformationQuery,
      GetUserValidatorInformationQueryVariables
    >({
      query: GetUserValidatorInformation,
      variables: { address: account },
    });

    return data.userValidatorInformations;
  });
};

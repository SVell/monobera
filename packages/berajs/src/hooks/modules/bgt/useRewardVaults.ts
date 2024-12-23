import useSWR from "swr";

import { getRewardVaults } from "~/actions/bgt/getRewardVaults";
import { DefaultHookOptions, useBeraJs } from "../../..";
import { GetVaultsQueryVariables } from "@bera/graphql/pol/api";

export const useRewardVaults = (
  filter?: GetVaultsQueryVariables,
  options?: DefaultHookOptions,
) => {
  const { config: beraConfig, account } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = ["defaultGaugeList", config, account, filter];
  const swrResponse = useSWR(
    QUERY_KEY,
    async () => {
      return await getRewardVaults(config, filter);
    },
    {
      ...options?.opts,
    },
  );

  return {
    ...swrResponse,
    refresh: swrResponse.mutate,
  };
};

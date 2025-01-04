import { type GetRewardVaultQuery } from "@bera/graphql/pol/subgraph";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { Address } from "viem";

import { getRewardVault } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const usePollRewardVault = (
  stakingToken: Address | undefined,
  options?: DefaultHookOptions,
): DefaultHookReturnType<GetRewardVaultQuery | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = ["getRewardVault", stakingToken];

  const swrResponse = useSWRImmutable<GetRewardVaultQuery | undefined>(
    QUERY_KEY,
    async () => await getRewardVault({ config, stakingToken }),
    {
      ...options?.opts,
    },
  );

  return {
    ...swrResponse,
    refresh: () => mutate(QUERY_KEY),
  };
};

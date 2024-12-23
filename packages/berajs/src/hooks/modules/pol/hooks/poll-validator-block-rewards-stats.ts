import { type GetValidatorBlockRewardStatsQuery } from "@bera/graphql/pol/subgraph";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { Address } from "viem";

import { getValidatorBlockRewardStats } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const usePollValidatorBlockRewardStats = (
  address: Address,
  daysRange: number,
  options?: DefaultHookOptions,
): DefaultHookReturnType<GetValidatorBlockRewardStatsQuery | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = ["usePollValidatorBlockRewardStats", address, daysRange];
  const swrResponse = useSWRImmutable<
    GetValidatorBlockRewardStatsQuery | undefined
  >(
    QUERY_KEY,
    async () => {
      if (!address) {
        throw new Error(
          "usePollValidatorBlockRewardStats needs a valid validator address",
        );
      }
      return await getValidatorBlockRewardStats({
        config,
        address: address,
        daysRange,
      });
    },
    {
      ...options?.opts,
    },
  );

  return {
    ...swrResponse,
    refresh: () => mutate(QUERY_KEY),
  };
};

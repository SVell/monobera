import { balancerApiChainName } from "@bera/config";
import { GqlChain, PoolHistoricalDataFragment } from "@bera/graphql/dex/api";
import useSWR from "swr";

import { getPoolHistoricalData } from "~/actions";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types/global";

type UsePoolHistoricalDataArgs = {
  poolId: string | undefined;
};

export const usePoolHistoricalData = (
  { poolId }: UsePoolHistoricalDataArgs,
  options?: DefaultHookOptions,
): DefaultHookReturnType<PoolHistoricalDataFragment[] | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = ["pool_history", poolId];
  const swrResponse = useSWR<
    PoolHistoricalDataFragment[] | undefined,
    any,
    any
  >(QUERY_KEY, async () => {
    if (!poolId) return undefined;
    return await getPoolHistoricalData({
      poolId,
      config,
      chain: balancerApiChainName as GqlChain,
    });
  });

  return {
    ...swrResponse,
    refresh: () => void swrResponse.mutate(),
  };
};

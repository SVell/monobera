import useSWR, { mutate } from "swr";
import { PublicClient } from "viem";
import { usePublicClient } from "wagmi";

import { getRewardAllocationBlockDelay } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const useRewardAllocationBlockDelay = (
  options?: DefaultHookOptions,
): DefaultHookReturnType<bigint | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const publicClient = usePublicClient();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY =
    publicClient && config ? ["useRewardAllocationBlockDelay"] : null;

  const swrResponse = useSWR<bigint | undefined>(
    QUERY_KEY,
    async () => {
      return await getRewardAllocationBlockDelay({
        config,
        client: publicClient as PublicClient,
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

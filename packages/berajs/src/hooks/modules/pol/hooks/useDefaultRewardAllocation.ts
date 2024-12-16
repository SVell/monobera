import useSWR, { mutate } from "swr";
import { usePublicClient } from "wagmi";

import {
  DefaultRewardAllocation,
  getDefaultRewardAllocation,
} from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const useDefaultRewardAllocation = (
  options?: DefaultHookOptions,
): DefaultHookReturnType<DefaultRewardAllocation | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const publicClient = usePublicClient();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY =
    publicClient && config ? ["useDefaultRewardAllocation"] : null;

  const swrResponse = useSWR<DefaultRewardAllocation | undefined>(
    QUERY_KEY,
    async () => {
      if (!publicClient) throw new Error("publicClient is not defined");
      if (!config) throw new Error("missing beraConfig");
      return await getDefaultRewardAllocation({
        config,
        client: publicClient,
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

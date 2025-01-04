import useSWR, { mutate } from "swr";
import { Address, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

import {
  ValidatorQueuedRewardAllocation,
  getValidatorQueuedRewardAllocation,
} from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const useValidatorQueuedRewardAllocation = (
  pubKey: Address,
  options?: DefaultHookOptions,
): DefaultHookReturnType<ValidatorQueuedRewardAllocation | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const publicClient = usePublicClient();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY =
    publicClient && config && pubKey
      ? ["useValidatorQueuedRewardAllocation", pubKey]
      : null;

  const swrResponse = useSWR<ValidatorQueuedRewardAllocation | undefined>(
    QUERY_KEY,
    async () => {
      return await getValidatorQueuedRewardAllocation({
        config,
        client: publicClient as PublicClient,
        pubKey: pubKey,
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

import useSWR, { mutate } from "swr";
import { Address, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

import {
  ValidatorRewardAllocation,
  getValidatorRewardAllocation,
} from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const useValidatorRewardAllocation = (
  pubKey: Address,
  options?: DefaultHookOptions,
): DefaultHookReturnType<ValidatorRewardAllocation | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const publicClient = usePublicClient();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY =
    publicClient && config && pubKey
      ? ["useValidatorRewardAllocation", pubKey]
      : null;

  const swrResponse = useSWR<ValidatorRewardAllocation | undefined>(
    QUERY_KEY,
    async () => {
      return await getValidatorRewardAllocation({
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

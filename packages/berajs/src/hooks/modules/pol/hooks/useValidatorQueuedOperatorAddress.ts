import useSWR, { mutate } from "swr";
import { Address, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

import {
  ValidatorQueuedOperatorAddress,
  getValidatorQueuedOperatorAddress,
} from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const useValidatorQueuedOperatorAddress = (
  pubKey: Address,
  options?: DefaultHookOptions,
): DefaultHookReturnType<ValidatorQueuedOperatorAddress | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const publicClient = usePublicClient();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY =
    publicClient && config && pubKey
      ? ["useValidatorQueuedOperatorAddress", pubKey]
      : null;

  const swrResponse = useSWR<ValidatorQueuedOperatorAddress | undefined>(
    QUERY_KEY,
    async () => {
      return await getValidatorQueuedOperatorAddress({
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

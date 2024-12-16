import useSWR, { mutate } from "swr";
import { Address, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

import {
  ValidatorOperatorAddress,
  getValidatorOperatorAddress,
} from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const useValidatorOperatorAddress = (
  pubKey: Address,
  options?: DefaultHookOptions,
): DefaultHookReturnType<ValidatorOperatorAddress | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const publicClient = usePublicClient();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY =
    publicClient && config && pubKey
      ? ["useValidatorOperatorAddress", pubKey]
      : null;

  const swrResponse = useSWR<ValidatorOperatorAddress | undefined>(
    QUERY_KEY,
    async () => {
      return await getValidatorOperatorAddress({
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

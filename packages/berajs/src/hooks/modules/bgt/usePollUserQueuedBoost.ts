import useSWR, { mutate } from "swr";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import {
  BoostedQueueInfo,
  getUserBoostedQueue,
} from "~/actions/bgt/getUserQueueInfo";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";
import { usePollValidatorInfo } from "./usePollValidatorInfo";

export interface UsePollValidatorInfoResponse
  extends DefaultHookReturnType<{
    [key: Address]: BoostedQueueInfo;
  }> {}

export const usePollUserQueuedBoost = (
  options?: DefaultHookOptions,
): UsePollValidatorInfoResponse => {
  const publicClient = usePublicClient();
  const { account, config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const { validatorInfoList } = usePollValidatorInfo();
  const validatorAddressList = validatorInfoList.map(
    (validator) => validator.coinbase,
  );
  const QUERY_KEY = account
    ? [account, validatorAddressList, "usePollUserQueuedBoost"]
    : null;

  const swrResponse = useSWR<any>(
    QUERY_KEY,
    async () =>
      await getUserBoostedQueue({
        account,
        validatorAddressList,
        config,
        publicClient,
      }),
    {
      ...options?.opts,
    },
  );

  return {
    ...swrResponse,
    refresh: () => mutate(QUERY_KEY),
  };
};

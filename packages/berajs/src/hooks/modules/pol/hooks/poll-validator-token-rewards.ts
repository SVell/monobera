import { type GetValidatorIncentivesReceivedsQuery } from "@bera/graphql/pol/subgraph";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { Address } from "viem";

import { getValidatorIncentivesReceiveds } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const usePollValidatorTokenRewards = (
  address: Address,
  daysRange: number,
  options?: DefaultHookOptions,
): DefaultHookReturnType<GetValidatorIncentivesReceivedsQuery | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = [
    "usePollValidatorTokenRewardsSubgraph",
    address,
    daysRange,
  ];
  const swrResponse = useSWRImmutable<
    GetValidatorIncentivesReceivedsQuery | undefined
  >(
    QUERY_KEY,
    async () => {
      if (!address) {
        throw new Error(
          "usePollValidatorBgtStaked needs a valid validator address",
        );
      }

      return await getValidatorIncentivesReceiveds({
        config,
        address,
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

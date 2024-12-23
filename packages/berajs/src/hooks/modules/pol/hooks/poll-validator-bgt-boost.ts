import { type GetValidatorBgtBoostQuery } from "@bera/graphql/pol/subgraph";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { Address } from "viem";

import { getValidatorBgtBoost } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const usePollValidatorBgtBoost = (
  address: Address,
  options?: DefaultHookOptions,
): DefaultHookReturnType<GetValidatorBgtBoostQuery | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = ["useValidatorBgtBoostSubgraph", address];

  const swrResponse = useSWRImmutable<GetValidatorBgtBoostQuery | undefined>(
    QUERY_KEY,
    async () => {
      if (!address) {
        throw new Error(
          "usePollValidatorBgtBoost needs a valid validator address",
        );
      }
      return await getValidatorBgtBoost({ config, address: address });
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

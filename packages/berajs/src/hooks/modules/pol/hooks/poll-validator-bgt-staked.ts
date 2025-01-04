import { type GetValidatorBgtStakedQuery } from "@bera/graphql/pol/subgraph";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { Address } from "viem";

import { getValidatorBgtStaked } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const usePollValidatorBgtStaked = (
  address: Address,
  daysRange: number,
  options?: DefaultHookOptions,
): DefaultHookReturnType<GetValidatorBgtStakedQuery | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = ["useValidatorBgtStakedSubgraph", address, daysRange];
  const swrResponse = useSWRImmutable<GetValidatorBgtStakedQuery | undefined>(
    QUERY_KEY,
    async () => {
      if (!address) {
        throw new Error(
          "usePollValidatorBgtStaked needs a valid validator address",
        );
      }
      return await getValidatorBgtStaked({
        config,
        address: address,
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

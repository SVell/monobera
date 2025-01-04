import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";

import { getGaugesData } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";
import { type GetGaugesQuery } from "@bera/graphql/pol/subgraph";

export const usePollGaugesData = (
  options?: DefaultHookOptions,
): DefaultHookReturnType<GetGaugesQuery | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = ["useGaugesSubgraph"];

  const swrResponse = useSWRImmutable<GetGaugesQuery | undefined>(
    QUERY_KEY,
    async () => await getGaugesData({ config }),
    {
      ...options?.opts,
    },
  );

  return {
    ...swrResponse,
    refresh: () => mutate(QUERY_KEY),
  };
};

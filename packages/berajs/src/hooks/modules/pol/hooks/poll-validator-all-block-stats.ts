import { type GetAllValidatorBlockCountQuery } from "@bera/graphql/pol/subgraph";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";

import { getValidatorAllBlockStats } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const usePollValidatorAllBlockStats = (
  options?: DefaultHookOptions,
): DefaultHookReturnType<GetAllValidatorBlockCountQuery | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = ["useValidatorAllBlockStats"];
  const swrResponse = useSWRImmutable<
    GetAllValidatorBlockCountQuery | undefined
  >(
    QUERY_KEY,
    async () => {
      return await getValidatorAllBlockStats({
        config,
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

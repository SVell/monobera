import useSWR, { mutate } from "swr";

import { getTokenHoneyPrice } from "~/actions/honey";
import { getSubgraphTokenInformation } from "~/actions/shared/getSubgraphTokenInformation";
import POLLING from "~/enum/polling";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types/global";
import { Token, useBeraJs } from "../..";

/**
 *
 * @returns the current honey price of a given token
 */

export type UseSubgraphTokenInformationArgs = {
  tokenAddress: `0x${string}` | undefined;
};

export const useSubgraphTokenInformation = (
  args: UseSubgraphTokenInformationArgs,
  options?: DefaultHookOptions,
): DefaultHookReturnType<Token | undefined> => {
  const method = "subgraphTokenInformation";
  const QUERY_KEY = [args.tokenAddress, method];
  const { config: beraConfig } = useBeraJs();
  const swrResponse = useSWR<Token | undefined>(
    QUERY_KEY,
    async () => {
      const token = await getSubgraphTokenInformation({
        tokenAddress: args.tokenAddress,
        config: options?.beraConfigOverride ?? beraConfig,
      });
      return token;
    },
    {
      ...options,
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.FAST,
    },
  );
  return {
    ...swrResponse,
    refresh: () => swrResponse?.mutate?.(),
  };
};

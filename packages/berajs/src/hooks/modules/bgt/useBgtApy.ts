import useSWR from "swr";
import { Address } from "viem";

import POLLING from "~/enum/polling";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types/global";

/**
 *
 * @returns the current honey price of a given token
 */

export type UseBgtApyArgs = {
  receiptTokenAddress: Address | undefined;
  tvlInHoney: number | undefined;
};

export const useBgtApy = (
  args: UseBgtApyArgs,
  options?: DefaultHookOptions,
): DefaultHookReturnType<string | undefined> => {
  const QUERY_KEY = ["bgtApy", args.receiptTokenAddress, args.tvlInHoney];

  const swrResponse = useSWR<string | undefined>(
    QUERY_KEY,
    async () => {
      // This once used to work, but has been removed to avoid showing untested apy
      return "0";
    },
    {
      ...options,
      ...(options?.opts ?? {}),
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.SLOW,
    },
  );
  return {
    ...swrResponse,
    refresh: () => swrResponse?.mutate?.(),
  };
};

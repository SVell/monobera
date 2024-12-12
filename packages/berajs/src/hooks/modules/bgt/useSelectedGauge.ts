import useSWR, { mutate } from "swr";
import { Address, isAddress } from "viem";

import { getGauge } from "~/actions";
import { DefaultHookOptions, DefaultHookReturnType, Gauge } from "~/types";

export interface UsePollValidatorInfoResponse
  extends DefaultHookReturnType<Gauge | null> {}

/**
 *
 * @deprecated should be refactored to use the new endpoint and onchain data
 */
export const useSelectedGauge = (
  id: Address | undefined,
  options?: DefaultHookOptions,
): UsePollValidatorInfoResponse => {
  const QUERY_KEY = id ? ["useSelectedValidator", id] : null;
  const swrResponse = useSWR<Gauge | null, any, typeof QUERY_KEY>(
    QUERY_KEY,
    async () => {
      if (!id || !isAddress(id)) throw new Error("Invalid address");
      return await getGauge(id);
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

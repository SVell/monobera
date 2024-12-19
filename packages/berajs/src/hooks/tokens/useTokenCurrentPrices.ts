import useSWR from "swr";

import {
  TokenCurrentPriceMap,
  getTokenCurrentPrices,
} from "~/actions/shared/getTokenCurrentPrices";
import { DefaultHookReturnType } from "~/types/global";

export const useTokenCurrentPrices = (): DefaultHookReturnType<
  TokenCurrentPriceMap | undefined
> => {
  const QUERY_KEY = ["token-current-prices"];

  const swrResponse = useSWR<TokenCurrentPriceMap | undefined>(
    QUERY_KEY,
    async () => {
      return await getTokenCurrentPrices();
    },
  );

  return {
    ...swrResponse,
    refresh: () => void swrResponse.mutate(),
    // FIXME we should probably have a polling rate so this expires?
  };
};

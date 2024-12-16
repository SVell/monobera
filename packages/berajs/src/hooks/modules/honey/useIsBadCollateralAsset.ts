import useSWR from "swr";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import { isBadCollateralAsset, isBadCollateralResponse } from "~/actions/honey";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export interface UseIsBadCollateralResponse
  extends DefaultHookReturnType<isBadCollateralResponse | undefined> {}

export const useIsBadCollateralAsset = (
  { collateral }: { collateral: Address | undefined },
  options?: DefaultHookOptions,
): UseIsBadCollateralResponse => {
  const publicClient = usePublicClient();
  const method = "useIsBadCollateral";
  const QUERY_KEY = [method, collateral];
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;

  const swrResponse = useSWR(
    QUERY_KEY,
    async () => {
      if (!publicClient) throw new Error("publicClient is not defined");
      if (!config) throw new Error("missing beraConfig");
      if (!config.contracts?.honeyFactoryAddress)
        throw new Error("missing contract address honeyFactoryAddress");
      if (!collateral) throw new Error("missing collateral");
      return await isBadCollateralAsset({
        client: publicClient,
        config,
        collateral,
      });
    },
    {
      ...options?.opts,
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.NORMAL,
    },
  );

  return {
    ...swrResponse,
    refresh: () => void swrResponse.mutate(),
  };
};

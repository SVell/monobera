import useSWR from "swr";
import { usePublicClient } from "wagmi";
import { honeyFactoryAbi } from "~/abi";

import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const useIsBasketModeEnabled = (
  { isMint }: { isMint: boolean | undefined },
  options?: DefaultHookOptions,
): DefaultHookReturnType<boolean | undefined> => {
  const publicClient = usePublicClient();
  const method = "isBasketModeEnabled";
  const QUERY_KEY = [method, isMint];
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;

  const swrResponse = useSWR(
    QUERY_KEY,
    async () => {
      if (!publicClient) throw new Error("publicClient is not defined");
      if (!config) throw new Error("missing beraConfig");
      if (!config.contracts?.honeyFactoryAddress)
        throw new Error("missing contract address honeyFactoryAddress");
      if (isMint === undefined) throw new Error("undefined 'isMint' argument");
      const res = await publicClient.readContract({
        address: config.contracts!.honeyFactoryAddress,
        abi: honeyFactoryAbi,
        functionName: "isBasketModeEnabled",
        args: [isMint],
      });
      return res;
    },
    {
      ...options?.opts,
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.NORMAL,
    },
  );
  return {
    ...swrResponse,
    data: swrResponse.data,
    refresh: () => void swrResponse.mutate(),
  };
};

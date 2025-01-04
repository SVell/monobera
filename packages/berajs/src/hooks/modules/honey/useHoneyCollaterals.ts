import useSWR from "swr";
import { usePublicClient } from "wagmi";
import { getHoneyCollaterals } from "~/actions/honey";

import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType, Token } from "~/types";

export interface UseHoneyCollateralsResponse
  extends DefaultHookReturnType<Token[] | undefined> {}

export const useHoneyCollaterals = (
  tokenData: any | undefined,
  options?: DefaultHookOptions,
): UseHoneyCollateralsResponse => {
  const publicClient = usePublicClient();
  const method = "useHoneyTokens";
  const QUERY_KEY = tokenData ? [method] : undefined;
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;

  const swrResponse = useSWR(
    QUERY_KEY,
    async () => {
      if (!publicClient) throw new Error("publicClient is not defined");
      if (!config) throw new Error("missing beraConfig");
      if (!tokenData) throw new Error("tokenData not loaded");
      if (!config.contracts?.honeyFactoryAddress)
        throw new Error("missing contract address honeyFactoryAddress");

      const collateralList = await getHoneyCollaterals({
        client: publicClient,
        config,
      });
      const honeyTokens = tokenData.tokenList?.filter((token: Token) =>
        collateralList.includes(token.address),
      );

      // sort the tokens
      return honeyTokens?.sort((a: Token, b: Token) => {
        return (
          collateralList.indexOf(a.address) - collateralList.indexOf(b.address)
        );
      });
    },
    {
      ...options?.opts,
      refreshInterval: 0,
    },
  );

  return {
    ...swrResponse,
    refresh: () => void swrResponse.mutate(),
  };
};

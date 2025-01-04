import useSWR from "swr";
import { usePublicClient } from "wagmi";

import {
  HoneyPreviewMethod,
  HoneyPreviewResult,
  getHoneyPreview,
} from "~/actions";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";
import { DefaultHookOptions, DefaultHookReturnType, Token } from "~/types";

export interface UsePollHoneyPreviewArgs {
  collateral: Token | undefined;
  collateralList: Token[] | undefined;
  amount: string;
  mint: boolean; // true mint, false redeem
  given_in: boolean; // true given in, false given out
}

export interface UsePollHoneyPreviewResponse
  extends DefaultHookReturnType<HoneyPreviewResult | undefined> {}

export const usePollHoneyPreview = (
  {
    collateral,
    collateralList,
    amount,
    mint,
    given_in,
  }: UsePollHoneyPreviewArgs,
  options?: DefaultHookOptions,
): UsePollHoneyPreviewResponse => {
  const publicClient = usePublicClient();
  const method = mint
    ? given_in
      ? HoneyPreviewMethod.Mint
      : HoneyPreviewMethod.RequiredCollateral
    : given_in
      ? HoneyPreviewMethod.Redeem
      : HoneyPreviewMethod.HoneyToRedeem;

  const QUERY_KEY =
    collateral && Number(amount)
      ? [method, collateral?.address, amount, mint, given_in.toString()]
      : null;
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const swrResponse = useSWR(
    QUERY_KEY,
    async () => {
      if (!publicClient) throw new Error("publicClient is not defined");
      if (!config) throw new Error("missing beraConfig");
      if (!config.contracts?.honeyFactoryAddress)
        throw new Error("missing contract address honeyFactoryAddress");
      if (!collateral) throw new Error("invalid collateral");
      if (Number(amount) <= 0) throw new Error("invalid amount");
      return await getHoneyPreview({
        client: publicClient,
        config,
        collateral,
        collateralList,
        amount,
        method,
      });
    },
    {
      ...options?.opts,
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.FAST,
    },
  );

  return {
    ...swrResponse,
    refresh: () => void swrResponse.mutate(),
  };
};

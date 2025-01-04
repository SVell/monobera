import {
  gasTokenDecimals,
  gasTokenName,
  gasTokenSymbol,
  nativeTokenAddress,
} from "@bera/config";
import useSWRImmutable from "swr/immutable";
import { isAddress } from "viem";
import { usePublicClient } from "wagmi";

import { getTokenInformation } from "~/actions";
import {
  DefaultHookOptions,
  DefaultHookReturnType,
  Token,
  useBeraJs,
} from "../..";

export type UseTokenInformationResponse = DefaultHookReturnType<
  Token | undefined
>;

export type UseTokenInformationArgs = {
  address: string | undefined;
};
export const useTokenInformation = (
  args: UseTokenInformationArgs,
  options?: DefaultHookOptions,
): UseTokenInformationResponse => {
  const publicClient = usePublicClient();
  const { config: beraConfig } = useBeraJs();
  const QUERY_KEY =
    args?.address && publicClient ? [args.address, publicClient] : null;
  const swrResponse = useSWRImmutable<Token | undefined>(
    QUERY_KEY,
    async () => {
      if (args?.address === nativeTokenAddress) {
        return {
          address: nativeTokenAddress,
          decimals: gasTokenDecimals,
          name: gasTokenName,
          symbol: gasTokenSymbol,
        } satisfies Token;
      }
      if (!args?.address || !isAddress(args.address, { strict: false })) {
        throw new Error("Invalid address");
      }
      return await getTokenInformation({
        address: args.address,
        config: options?.beraConfigOverride ?? beraConfig,
        publicClient,
      });
    },
    { ...options?.opts },
  );

  return {
    ...swrResponse,
    refresh: () => swrResponse?.mutate?.(),
  };
};

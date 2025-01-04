import {
  gasTokenDecimals,
  gasTokenName,
  gasTokenSymbol,
  nativeTokenAddress,
} from "@bera/config";
import useSWRImmutable from "swr/immutable";
import { isAddress } from "viem";
import { usePublicClient } from "wagmi";

import {
  DefaultHookOptions,
  DefaultHookReturnType,
  Token,
  useBeraJs,
} from "../..";
import { getStakingTokenInformation } from "../../actions/dex/getStakingTokenInformation";

export type UseStakingTokenInformationResponse = DefaultHookReturnType<
  Partial<Token> | undefined
>;

export type useStakingTokenInformationArgs = {
  address: string | undefined;
  includeTotalSupply?: boolean;
};
export const useStakingTokenInformation = (
  args: useStakingTokenInformationArgs,
  options?: DefaultHookOptions,
): UseStakingTokenInformationResponse => {
  const publicClient = usePublicClient();
  const { config: beraConfig } = useBeraJs();
  const QUERY_KEY =
    args?.address && publicClient
      ? [args.address, publicClient, args.includeTotalSupply]
      : null;
  const swrResponse = useSWRImmutable<Partial<Token> | undefined>(
    QUERY_KEY,
    async () => {
      if (args?.address === nativeTokenAddress) {
        return {
          address: nativeTokenAddress,
          decimals: gasTokenDecimals,
          name: gasTokenName,
          symbol: gasTokenSymbol,
        };
      }

      if (!args?.address || !isAddress(args.address, { strict: false })) {
        throw new Error("Invalid address");
      }

      return await getStakingTokenInformation({
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

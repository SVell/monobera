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

export type UseMultipleTokenInformationResponse = DefaultHookReturnType<
  Token[]
>;

export type useMultipleTokenInformationArgs = {
  addresses: string[] | readonly string[] | undefined;
};
export const useMultipleTokenInformation = (
  args: useMultipleTokenInformationArgs,
  options?: DefaultHookOptions,
): UseMultipleTokenInformationResponse => {
  const publicClient = usePublicClient();
  const { config: beraConfig } = useBeraJs();
  const QUERY_KEY =
    publicClient && args.addresses
      ? ["useMultipleTokenInformation", args.addresses]
      : null;
  const swrResponse = useSWRImmutable<Token[]>(
    QUERY_KEY,
    async () => {
      return Promise.all(
        args.addresses!.map(async (address) => {
          if (!address || !isAddress(address, { strict: false })) {
            throw new Error("Invalid address");
          }

          const tk = await getTokenInformation({
            address: address,
            config: options?.beraConfigOverride ?? beraConfig,
            publicClient,
          });

          if (!tk) {
            throw new Error(`Token ${address} not found`);
          }

          return tk;
        }),
      );
    },
    { ...options?.opts },
  );

  return {
    ...swrResponse,
    refresh: () => swrResponse?.mutate?.(),
  };
};

import useSWR from "swr";
import { Address, formatEther } from "viem";
import { usePublicClient } from "wagmi";

import { getUserVaultsBalance } from "~/actions/bgt/getUserVaultsBalance";
import { getUserVaultsReward } from "~/actions/bgt/getUserVaultsReward";
import { getVaultsSupply } from "~/actions/bgt/getVaultsSupply";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types/global";

export interface UsePollVaultsInfoRes {
  balance: string | undefined;
  rewards: string | undefined;
  percentage: string | undefined;
}

export const usePollVaultsInfo = (
  args: {
    vaultAddress: Address | undefined;
  },
  options?: DefaultHookOptions,
): DefaultHookReturnType<UsePollVaultsInfoRes | undefined> => {
  const { account, config: beraConfig } = useBeraJs();
  const publicClient = usePublicClient();
  const QUERY_KEY =
    account && publicClient && args.vaultAddress
      ? ["usePollUserVaultsInfo", account, args.vaultAddress]
      : null;

  const swrResponse = useSWR<UsePollVaultsInfoRes | undefined>(
    QUERY_KEY,
    async () => {
      if (!args.vaultAddress || !publicClient) return undefined;

      const [userBalance, userReward, totalSupply] = await Promise.all([
        getUserVaultsBalance({
          account,
          vaultAddress: args.vaultAddress,
          publicClient,
        }),
        getUserVaultsReward({
          account,
          vaultAddress: args.vaultAddress,
          publicClient,
        }),
        getVaultsSupply({
          vaultAddress: args.vaultAddress,
          publicClient,
        }),
      ]);

      return {
        balance: formatEther(userBalance),
        rewards: formatEther(userReward),
        percentage: totalSupply
          ? Number(
              parseFloat(formatEther(userBalance ?? 0n)) /
                parseFloat(formatEther(totalSupply ?? 0n)),
            ).toString()
          : "0",
      };
    },
    {
      ...options,
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.NORMAL,
    },
  );

  return {
    ...swrResponse,
    refresh: () => swrResponse.mutate(),
  };
};

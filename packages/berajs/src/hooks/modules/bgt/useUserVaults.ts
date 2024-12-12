import { multicallAddress, polEndpointUrl } from "@bera/config";
import useSWR from "swr";
import { Address, formatUnits } from "viem";
import { usePublicClient } from "wagmi";

import { BERA_VAULT_REWARDS_ABI } from "~/abi";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";
import { Vault } from "~/types";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types/global";

interface Call {
  abi: any;
  address: Address;
  functionName: string;
  args: any[];
}

/**
 *
 * @returns the current honey price of a given token
 */

export interface UserVault extends Vault {
  unclaimedBgt: string;
  balance: string;
}
export const useUserVaults = (
  options?: DefaultHookOptions,
): DefaultHookReturnType<
  | {
      totalBgtRewards: string;
      vaults: UserVault[];
      claimAllCalldata: any;
    }
  | undefined
> => {
  const { account } = useBeraJs();
  const publicClient = usePublicClient();
  const QUERY_KEY = ["useUserVaults", account];
  const swrResponse = useSWR<
    | {
        totalBgtRewards: string;
        vaults: UserVault[];
        claimAllCalldata: any;
      }
    | undefined
  >(
    QUERY_KEY,
    async () => {
      if (!account || !publicClient) return undefined;

      // TODO: remove deprecated endpoint
      const url = `${polEndpointUrl}/user/${account}/vaults`;
      const validatorList = await fetch(url);
      const temp: any = await validatorList.json();

      const vaultList: Vault[] = temp.userVaults;

      const calls: Call[] = vaultList.map((vault: Vault) => ({
        address: vault.vaultAddress,
        abi: BERA_VAULT_REWARDS_ABI,
        functionName: "earned",
        args: [account],
      }));

      const balanceCalls: Call[] = vaultList.map((vault: Vault) => ({
        address: vault.vaultAddress,
        abi: BERA_VAULT_REWARDS_ABI,
        functionName: "balanceOf",
        args: [account],
      }));

      const [result, balanceResult] = await Promise.all([
        publicClient.multicall({
          contracts: calls,
          multicallAddress: multicallAddress,
        }),
        publicClient.multicall({
          contracts: balanceCalls,
          multicallAddress: multicallAddress,
        }),
      ]);

      let total = 0n;
      const userVaults = vaultList.map((vault: Vault, index: number) => {
        const item = result[index];
        const balanceItem = balanceResult[index];
        total += item.result as bigint;

        if (item.status === "success") {
          return {
            ...vault,
            unclaimedBgt: formatUnits(item.result as bigint, 18),
            balance: formatUnits(balanceItem.result as bigint, 18),
          };
        }
        return {
          ...vault,
          unclaimedBgt: "0",
          balance: "0",
        };
      });

      const sortedUserVaults = userVaults.sort((a: any, b: any) => {
        const aUnclaimed = parseFloat(a.unclaimedBgt);
        const bUnclaimed = parseFloat(b.unclaimedBgt);
        return aUnclaimed - bUnclaimed;
      });

      return {
        totalBgtRewards: formatUnits(total, 18),
        vaults: sortedUserVaults as UserVault[],
        claimAllCalldata: "",
      };
    },
    {
      ...options,
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.NORMAL,
      keepPreviousData: true,
    },
  );
  return {
    ...swrResponse,
    refresh: () => swrResponse?.mutate?.(),
  };
};

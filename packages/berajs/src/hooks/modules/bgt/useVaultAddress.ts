import useSWR from "swr";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import { BERA_VAULT_REWARDS_ABI } from "~/abi";

export interface RewardVault {
  stakeToken: Address;
  address: Address;
}
export const useVaultAddress = (vaultAddress: Address) => {
  const publicClient = usePublicClient();
  const QUERY_KEY =
    vaultAddress && publicClient ? ["useVaultAddress", vaultAddress] : null;

  return useSWR<RewardVault>(QUERY_KEY, async () => {
    const [stakeToken] = await Promise.all([
      publicClient!.readContract({
        address: vaultAddress,
        abi: BERA_VAULT_REWARDS_ABI,
        functionName: "stakeToken",
      }),
    ]);
    return { stakeToken, address: vaultAddress };
  });
};

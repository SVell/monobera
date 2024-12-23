import { beraChefAddress } from "@bera/config";
import useSWR from "swr";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import { BERA_CHEF_ABI, BERA_VAULT_REWARDS_ABI } from "~/abi";
import { ADDRESS_ZERO } from "~/config";
import { useBeraJs } from "~/contexts";
import { useIsWhitelistedVault } from "~/hooks/useIsWhitelistedVault";
import { useRewardVaultFromToken } from "./useRewardVaultFromToken";

export const useRewardVaultBalanceFromStakingToken = ({
  stakingToken,
  rewardVaultAddress: _rewardVaultAddress,
}: {
  stakingToken: Address;
  rewardVaultAddress?: Address;
}) => {
  const { account } = useBeraJs();
  const client = usePublicClient();

  const {
    data: rewardVaultAddress = _rewardVaultAddress,
    error,
    mutate: mutateRewardVaultAddress,
  } = useRewardVaultFromToken({
    tokenAddress: stakingToken,
  });

  const { data: whitelistedVaults, refresh: refreshWhitelistedVaults } =
    useIsWhitelistedVault(
      rewardVaultAddress && rewardVaultAddress !== ADDRESS_ZERO
        ? [rewardVaultAddress]
        : [],
    );

  const swrResponse = useSWR(
    rewardVaultAddress
      ? ["useVaultBalanceFromStakingToken", rewardVaultAddress, account]
      : null,

    async () => {
      if (rewardVaultAddress === ADDRESS_ZERO) {
        return {
          address: rewardVaultAddress,
          isWhitelisted: false,
          balance: undefined,
        };
      }

      const isWhitelisted =
        whitelistedVaults?.find((vault) => vault.address === rewardVaultAddress)
          ?.isWhitelisted ?? false;

      const balance = account
        ? await client?.readContract({
            address: rewardVaultAddress!,
            abi: BERA_VAULT_REWARDS_ABI,
            functionName: "balanceOf",
            args: [account],
          })
        : undefined;

      return {
        address: rewardVaultAddress,
        isWhitelisted,
        balance: balance,
      };
    },
  );

  return {
    ...swrResponse,
    refresh: () => {
      mutateRewardVaultAddress();
      refreshWhitelistedVaults();
      swrResponse.mutate();
    },
  };
};

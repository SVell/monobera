import { rewardVaultFactoryAddress } from "@bera/config";
import useSWRImmutable from "swr/immutable";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import { rewardVaultFactoryAbi } from "~/abi";
import { ADDRESS_ZERO } from "~/config";

export const useRewardVaultsFromTokens = ({
  tokenAddresses,
}: {
  tokenAddresses: Address[];
}) => {
  const client = usePublicClient();

  return useSWRImmutable(
    client && tokenAddresses.length > 0
      ? ["useRewardVaultsFromTokens", tokenAddresses]
      : null,
    async () => {
      if (!tokenAddresses || tokenAddresses.length === 0) {
        throw new Error(
          "useRewardVaultsFromTokens needs valid token addresses",
        );
      }

      // Prepare multicall contracts for getVault
      const multicallContracts = tokenAddresses.map((tokenAddress) => ({
        address: rewardVaultFactoryAddress,
        abi: rewardVaultFactoryAbi,
        functionName: "getVault",
        args: [tokenAddress],
      }));

      const results = await client!.multicall({
        contracts: multicallContracts,
        allowFailure: true,
      });

      // Reduce results into a Record
      return tokenAddresses.reduce<Record<Address, Address>>(
        (acc, tokenAddress, index) => {
          const vaultAddress =
            (results?.[index]?.result as `0x${string}` | undefined) ||
            ADDRESS_ZERO;
          acc[tokenAddress] = vaultAddress;
          return acc;
        },
        {},
      );
    },
  );
};

import { beraChefAddress } from "@bera/config";
import useSWR from "swr";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import { BERA_CHEF_ABI } from "~/abi";

export const useIsWhitelistedVault = (vaultAddresses: Address[]) => {
  const client = usePublicClient();

  const swrResponse = useSWR(
    vaultAddresses.length > 0
      ? ["useIsWhitelistedVault", vaultAddresses]
      : null,
    async () => {
      if (vaultAddresses.length === 0) {
        return [];
      }

      // Prepare multicall contracts for isWhitelistedVault checks
      const multicallContracts = vaultAddresses.map((address) => ({
        address: beraChefAddress,
        abi: BERA_CHEF_ABI,
        functionName: "isWhitelistedVault",
        args: [address],
      }));

      // Execute the multicall
      const results = await client?.multicall({
        contracts: multicallContracts,
        allowFailure: true, // Allow individual calls to fail
      });

      // Map results to a more usable format
      return vaultAddresses.map((address, index) => ({
        address,
        isWhitelisted: results?.[index]?.result || false,
      }));
    },
  );

  return {
    ...swrResponse,
    refresh: () => swrResponse.mutate(),
  };
};

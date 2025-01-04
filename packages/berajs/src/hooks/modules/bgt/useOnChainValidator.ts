import {
  beraChefAddress,
  bgtTokenAddress,
  depositContractAddress,
} from "@bera/config";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";
import useSWR from "swr";
import { Address, keccak256 } from "viem";
import { usePublicClient } from "wagmi";

import { BERA_CHEF_ABI, BGT_ABI, beaconDepositAbi } from "~/abi";
import { DefaultHookReturnType } from "~/types";

export const useOnChainValidator = ({
  pubkey,
}: { pubkey: Address }): DefaultHookReturnType<
  Partial<ApiValidatorFragment>
> => {
  const publicClient = usePublicClient();
  const QUERY_KEY = pubkey ? ["useOnChainValidator", pubkey] : null;

  const swrResponse = useSWR<Partial<ApiValidatorFragment>>(
    QUERY_KEY,
    async () => {
      if (!publicClient) {
        throw new Error("Public client not found");
      }
      const [operator, depositCount, boostees, rewardAllocation] =
        await Promise.all([
          publicClient.readContract({
            address: depositContractAddress,
            abi: beaconDepositAbi,
            functionName: "getOperator",
            args: [pubkey],
          }),
          undefined,
          publicClient?.readContract({
            address: bgtTokenAddress,
            abi: BGT_ABI,
            functionName: "boostees",
            args: [pubkey],
          }),
          publicClient.readContract({
            address: beraChefAddress,
            abi: BERA_CHEF_ABI,
            functionName: "getActiveRewardAllocation",
            args: [pubkey],
          }),
        ]);

      return {
        id: keccak256(pubkey),
        pubkey,
        operator,
        votingPower: Number(boostees),
      } as Partial<ApiValidatorFragment>;
    },
  );

  return {
    ...swrResponse,
    refresh: () => {
      swrResponse.mutate();
    },
  };
};

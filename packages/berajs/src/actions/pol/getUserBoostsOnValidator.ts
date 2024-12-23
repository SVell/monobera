import { bgtTokenAddress } from "@bera/config";
import { GetPublicClientReturnType } from "@wagmi/core";
import { Address, formatEther } from "viem";
import { BGT_ABI } from "~/abi";
import { type BeraConfig } from "~/types";

export type UserBoostsOnValidator = {
  pubkey: Address;
  activeBoosts: string;
  queuedBoosts: string;
  queuedBoostStartBlock: number;
  queuedUnboosts: string;
  queuedUnboostStartBlock: number;
  hasPendingBoosts: boolean;
  hasActiveBoosts: boolean;
};

export const getUserBoostsOnValidator = async ({
  config,
  account,
  pubkey,
  publicClient,
}: {
  config: BeraConfig;
  account: Address;
  pubkey: Address;
  publicClient: GetPublicClientReturnType;
}): Promise<UserBoostsOnValidator> => {
  if (!account) {
    throw new Error("account is required");
  }
  if (!publicClient) {
    throw new Error("publicClient is required");
  }

  const [activeBoosts, queuedBoosts, queuedUnboosts] = await Promise.all([
    publicClient.readContract({
      address: bgtTokenAddress,
      abi: BGT_ABI,
      functionName: "boosted",
      args: [account!, pubkey!],
    }),
    publicClient.readContract({
      address: bgtTokenAddress,
      abi: BGT_ABI,
      functionName: "boostedQueue",
      args: [account!, pubkey!],
    }),
    publicClient.readContract({
      address: bgtTokenAddress,
      abi: BGT_ABI,
      functionName: "dropBoostQueue",
      args: [account!, pubkey!],
    }),
  ]);

  return {
    pubkey,
    activeBoosts: formatEther(activeBoosts),
    queuedBoosts: formatEther(queuedBoosts[1]),
    queuedUnboosts: formatEther(queuedUnboosts[1]),
    queuedBoostStartBlock: queuedBoosts[0],
    queuedUnboostStartBlock: queuedUnboosts[0],
    hasPendingBoosts:
      Number(queuedBoosts[1]) > 0 || Number(queuedUnboosts[1]) > 0,
    hasActiveBoosts: Number(activeBoosts) > 0,
  };
};

import {
  Address,
  PublicClient,
  erc20Abi,
  formatEther,
  formatUnits,
} from "viem";

import { BERA_VAULT_REWARDS_ABI } from "~/abi";

export interface RewardVaultIncentive {
  token: Address;
  manager: Address;
  minIncentiveRate: string;
  incentiveRate: string;
  amountRemaining: string;
}

export const getRewardVaultIncentives = async (
  gaugeAddress: Address,
  publicClient: PublicClient,
) => {
  const whitelistedTokens = await publicClient.readContract({
    address: gaugeAddress,
    abi: BERA_VAULT_REWARDS_ABI,
    functionName: "getWhitelistedTokens",
  });

  const incentivesInfoPromise = Promise.all(
    whitelistedTokens.map((incentive) =>
      publicClient.readContract({
        address: gaugeAddress,
        abi: BERA_VAULT_REWARDS_ABI,
        functionName: "incentives",
        args: [incentive],
      }),
    ),
  );

  const decimalsPromise = Promise.all(
    whitelistedTokens.map((incentive) =>
      publicClient.readContract({
        address: incentive,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ),
  );

  const symbolPromise = Promise.all(
    whitelistedTokens.map((incentive) =>
      publicClient.readContract({
        address: incentive,
        abi: erc20Abi,
        functionName: "symbol",
      }),
    ),
  );

  const [incentives, decimals, symbols] = await Promise.all([
    incentivesInfoPromise,
    decimalsPromise,
    symbolPromise,
  ]);

  return incentives.map<RewardVaultIncentive>(
    ([minIncentiveRate, incentiveRate, amountRemaining, manager], index) => ({
      token: whitelistedTokens[index],
      manager,
      minIncentiveRate: formatEther(minIncentiveRate),
      incentiveRate: formatEther(incentiveRate),
      amountRemaining: formatUnits(amountRemaining, decimals[index]),
      symbol: symbols[index],
    }),
  );
};

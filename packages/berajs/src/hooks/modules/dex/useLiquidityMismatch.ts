import { useEffect, useState } from "react";
import { PoolType } from "@berachain-foundation/berancer-sdk";

import { wrapNativeTokens } from "~/utils/tokenWrapping";
import { TokenCurrentPriceMap } from "~/actions";
import { TokenWithAmount } from "~/types";
import { Oracle, OracleMode } from "./useCreatePool";

const DEFAULT_LIQUIDITY_MISMATCH_TOLERANCE_PERCENT = 0.05; // 5%

export type LiquidityMismatchInfo = {
  title: string | null;
  message: string | null;
  suggestWeighted?: boolean;
};

interface UseLiquidityMismatchParams {
  currentStep: number;
  tokenPrices?: TokenCurrentPriceMap;
  isLoadingTokenPrices: boolean;
  tokens: TokenWithAmount[] | null;
  weights: bigint[] | null;
  weightsError: string | null;
  poolType: PoolType;
  liquidityMismatchTolerancePercent?: number;
  oracles: Oracle[];
}

/**
 * Hook for detecting liquidity mismatches.
 *
 * @param {number} currentStep - The current step of the pool creation process.
 * @param {Record<string, number>} tokenPrices - The current token prices.
 * @param {boolean} isLoadingTokenPrices - Whether the token prices are still loading.
 * @param {Array<{ address: string, amount: number }>} tokens - The tokens in the pool, including their addresses and amounts.
 * @param {Record<string, number>} weights - The per-token weights in the pool we are creating.
 * @param {string | null} weightsError - An error message for the weights indicating that the weights are invalid.
 * @param {string} poolType - The type of pool being created.
 * @param {number} liquidityMismatchTolerancePercent - The tolerance for liquidity mismatches in percent.
 * @returns {Object} The liquidity mismatch info.
 */
export const useLiquidityMismatch = ({
  currentStep,
  tokenPrices,
  isLoadingTokenPrices,
  tokens,
  weights,
  weightsError,
  poolType,
  liquidityMismatchTolerancePercent = DEFAULT_LIQUIDITY_MISMATCH_TOLERANCE_PERCENT,
  oracles,
}: UseLiquidityMismatchParams): LiquidityMismatchInfo => {
  // NOTE: would be nice to use Maps/Records more in here, as the zipping/unzipping is cumbersome.
  // NOTE: if we pull in string literal for currentStep things would also be a bit clearer in here.
  const [liquidityMismatchInfo, setLiquidityMismatchInfo] =
    useState<LiquidityMismatchInfo>({ title: null, message: null });

  useEffect(() => {
    // If we are either using custom rate-providing oracles or have incorrect/loading token prices, we cant do validation.
    if (
      !tokenPrices ||
      isLoadingTokenPrices ||
      !tokens ||
      !weights ||
      weightsError ||
      tokens.some((token) => !token.address) ||
      oracles.some((oracle) => oracle.mode === OracleMode.Custom) // Oracles give prices on their own, we dont support that here yet.
    ) {
      setLiquidityMismatchInfo({ title: null, message: null });
      return;
    }

    // Calculate some basic metrics we'll use to determine per-token contributions and model potential losses from arbitrage.
    let totalLiquidityUSD = 0;
    const tokenUSDAmounts: number[] = [];
    const numTokens = tokens.length;
    const wrappedTokens = wrapNativeTokens(tokens);
    const tokenUSDPrices = wrappedTokens.map((token) => {
      const tokenPriceUSD =
        tokenPrices[token.address.toLowerCase()]?.price ?? 0;
      if (!tokenPriceUSD || tokenPriceUSD === 0) {
        tokenUSDAmounts.push(0);
        return null;
      }
      const tokenAmountUSD = tokenPriceUSD * parseFloat(token.amount);
      tokenUSDAmounts.push(tokenAmountUSD);
      totalLiquidityUSD += tokenAmountUSD;
      return tokenPriceUSD;
    });

    // Doesn't matter what step it is, if we have missing token prices for tokens we have selected, we cant issue a real warning.
    if (tokenUSDPrices.some((price) => price === null)) {
      setLiquidityMismatchInfo({
        title: "Missing token price data",
        message: `One or more token(s) do not have valid market price data. Please verify that token market prices align with the pool
                  weightings and your initial liquidity amounts.`,
      });
      return;
    }

    // Step 1 - During token selection we check for a deviation in the quote prices of the tokens selected (for stable pools).
    if (currentStep === 1 && poolType === PoolType.ComposableStable) {
      const normalizedUSDPrices = tokenUSDPrices.map(
        (priceUSD) => priceUSD! / tokenUSDPrices[0]!, // always normalize on the first token's price
      );
      const maxDifference =
        Math.max(...normalizedUSDPrices) - Math.min(...normalizedUSDPrices);

      if (maxDifference > liquidityMismatchTolerancePercent) {
        setLiquidityMismatchInfo({
          title: "Selected tokens have a significant price deviation",
          message: "Did you mean to create a Weighted pool instead?",
          suggestWeighted: true,
        });
      } else {
        setLiquidityMismatchInfo({ title: null, message: null });
      }

      return;
    }

    // Validation During Liquidity Input and onwards.
    if (
      totalLiquidityUSD === 0 ||
      tokenUSDAmounts.some((value) => value === 0)
    ) {
      // User has not yet entered fully their liquidity values, so return early.
      setLiquidityMismatchInfo({ title: null, message: null });
      return;
    }

    // Simulate arbitrage for the pool to determine potential losses from arbitrageurs.
    // NOTE: we assume shortfalls and excesses are losses, but in reality the actual losses would be more complex to realise.
    // Balancer does this similarily https://github.com/balancer/frontend-v2/blob/8563b8d33b6bff266148bd48d7ebc89f921374f4/src/components/cards/CreatePool/InitialLiquidity.vue#L75
    let totalLossUSD = 0;
    if (poolType === PoolType.ComposableStable) {
      const expectedPerTokenLiquidityUSD = totalLiquidityUSD / numTokens;
      tokenUSDAmounts.forEach((value) => {
        totalLossUSD += Math.abs(expectedPerTokenLiquidityUSD - value);
      });
    } else if (poolType === PoolType.Weighted) {
      tokenUSDAmounts.forEach((value, index) => {
        const weightProportion = Number(weights[index]) / 1e18;
        const expectedValueUSD = totalLiquidityUSD * weightProportion;
        totalLossUSD += Math.abs(expectedValueUSD - value);
      });
    }

    // We'll show a total loss if it's 90% or more
    const isTotalLoss = totalLossUSD >= totalLiquidityUSD * 0.9;
    totalLossUSD = Math.min(totalLossUSD, totalLiquidityUSD);
    const totalLossPercentage = totalLossUSD / totalLiquidityUSD;

    if (totalLossPercentage > liquidityMismatchTolerancePercent) {
      setLiquidityMismatchInfo({
        // If it's a total loss we dont display a percentage
        title: isTotalLoss
          ? "You could lose all of your initial liquidity"
          : `You could lose $${totalLossUSD.toFixed(2)} (~${(
              totalLossPercentage * 100
            ).toFixed(2)}%)`,
        message: `Based on the market token prices, the value of tokens does not align with the specified pool weights. 
          This discrepancy could expose you to potential losses from arbitrageurs. ${
            poolType === PoolType.ComposableStable
              ? "Did you mean to create a Weighted pool instead?"
              : ""
          }`,
        suggestWeighted: poolType === PoolType.ComposableStable,
      });
    } else {
      // All good bb bb
      setLiquidityMismatchInfo({ title: null, message: null });
    }
  }, [
    currentStep,
    tokenPrices,
    isLoadingTokenPrices,
    tokens,
    weights,
    weightsError,
    poolType,
    liquidityMismatchTolerancePercent,
  ]);
  return liquidityMismatchInfo;
};

import { useEffect, useState } from "react";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { formatUnits, parseUnits } from "viem";

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
  const [liquidityMismatchInfo, setLiquidityMismatchInfo] =
    useState<LiquidityMismatchInfo>({ title: null, message: null });

  useEffect(() => {
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

    const wrappedTokens = wrapNativeTokens(tokens);

    if (currentStep === 1) {
      // Step 1: Validate token prices for equivalence only
      const tokenUSDValues = wrappedTokens.map((token) => {
        const tokenPriceUSD =
          tokenPrices[token.address.toLowerCase()]?.price ?? 0;
        return tokenPriceUSD > 0 ? tokenPriceUSD : null;
      });

      if (tokenUSDValues.some((price) => price === null)) {
        setLiquidityMismatchInfo({
          title: "Missing token price data",
          message:
            "Some tokens do not have valid price data. Please check and try again.",
        });
        return;
      }

      const normalizedPrices = tokenUSDValues.map(
        (price) => price! / tokenUSDValues[0]!,
      );
      const maxDifference =
        Math.max(...normalizedPrices) - Math.min(...normalizedPrices);

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

    // Step 2: Perform full token amount and weight validation
    let totalLiquidityUSD = 0;
    const tokenUSDValues: number[] = [];
    wrappedTokens.forEach((token) => {
      const tokenPriceUSD =
        tokenPrices[token.address.toLowerCase()]?.price ?? 0;
      const tokenAmount = parseFloat(token.amount);

      if (tokenPriceUSD > 0 && tokenAmount > 0) {
        const tokenLiquidityUSD = tokenPriceUSD * tokenAmount;
        tokenUSDValues.push(tokenLiquidityUSD);
        totalLiquidityUSD += tokenLiquidityUSD;
      }
    });

    if (totalLiquidityUSD === 0) {
      setLiquidityMismatchInfo({ title: null, message: null });
      return;
    }

    // NOTE: this is a simplistic way of calculating losses as we can't know the actual price the pool would end up at.
    let totalLossUSD = 0;
    if (poolType === PoolType.ComposableStable) {
      const expectedValueUSD = totalLiquidityUSD / tokenUSDValues.length;
      tokenUSDValues.forEach((value) => {
        totalLossUSD += Math.abs(expectedValueUSD - value);
      });
    } else if (poolType === PoolType.Weighted) {
      tokenUSDValues.forEach((value, index) => {
        const weightProportion = Number(weights[index]) / 1e18;
        const expectedValueUSD = totalLiquidityUSD * weightProportion;
        totalLossUSD += Math.abs(expectedValueUSD - value);
      });
    }

    const totalLossPercentage = Math.min(totalLossUSD / totalLiquidityUSD, 1);

    if (totalLossPercentage > liquidityMismatchTolerancePercent) {
      setLiquidityMismatchInfo({
        title:
          totalLossPercentage === 1
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

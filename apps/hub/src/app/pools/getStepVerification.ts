import { Oracle, Token, TokenInput } from "@bera/berajs";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { isAddress } from "viem";

import { OwnershipType } from "./components/parameters-input";

/**
 * Verifies the steps required for pool creation.
 *
 * @param {Token[]} poolCreateTokens - The tokens to be created in the pool.
 * @param {TokenInput[]} initialLiquidityTokens - The initial liquidity tokens.
 * @param {PoolType} poolType - The type of the pool.
 * @param {bigint[]} weights - The weights of the tokens.
 * @param {Oracle[]} oracles - The oracles for the tokens.
 * @param {(address: string) => boolean} isAddress - Function to validate addresses.
 * @param {{ Custom: string }} OracleMode - The mode of the oracle.
 * @param {string} owner - The owner of the pool.
 * @param {OwnershipType} ownershipType - The type of ownership.
 * @param {boolean} swapFeeIsInvalid - Whether the swap fee is invalid.
 * @param {boolean} amplificationInvalid - Whether the amplification is invalid.
 * @param {number | null} amplification - The amplification factor.
 * @param {string} poolName - The name of the pool.
 * @param {string} poolSymbol - The symbol of the pool.
 * @returns {{ steps: boolean[], errors: (string | null)[] }} The verification steps and errors.
 */
export const getStepVerification = (
  poolCreateTokens: Token[],
  initialLiquidityTokens: TokenInput[],
  poolType: PoolType,
  weights: bigint[],
  oracles: Oracle[],
  OracleMode: { Custom: string },
  owner: string,
  ownershipType: OwnershipType,
  swapFeeIsInvalid: boolean,
  amplificationInvalid: boolean,
  amplification: number | null,
  poolName: string,
  poolSymbol: string,
) => {
  const errors: (string | null)[] = Array(5).fill(null); // Initialize errors with null

  const steps = [
    // Step 0: Pool type (always complete, impossible to fail)
    true,

    // Step 1: Select tokens
    (() => {
      const hasEmptyToken = poolCreateTokens.some(
        (token) => token.address.length === 0,
      );
      const hasZeroWeight =
        poolType === PoolType.Weighted &&
        weights.some((weight) => weight === 0n);

      const hasUnsetCustomOracles = oracles.some(
        (oracle) =>
          oracle.mode === OracleMode.Custom && !isAddress(oracle.address),
      );

      if (hasEmptyToken) {
        errors[1] = "All token slots must have a valid token selected.";
        return false;
      }

      if (hasZeroWeight) {
        errors[1] = "Weights must be greater than 0 for Weighted Pools.";
        return false;
      }

      if (hasUnsetCustomOracles) {
        errors[1] =
          "All rate-providing token oracles must have a valid address.";
        return false;
      }

      return true;
    })(),

    // Step 2: Deposit liquidity
    (() => {
      const isValid =
        !initialLiquidityTokens.some(
          (token) =>
            !token.amount ||
            Number(token.amount) <= 0 ||
            token.amount === "" ||
            token.exceeding,
        ) && poolCreateTokens.length === initialLiquidityTokens.length;
      if (!isValid)
        errors[2] = "Ensure all tokens have valid liquidity amounts.";
      return isValid;
    })(),

    // Step 3: Set parameters
    (() => {
      if (!owner) {
        errors[3] = "Owner address is required.";
        return false;
      }

      if (ownershipType === OwnershipType.Custom && !isAddress(owner)) {
        errors[3] = "Custom owner address is invalid.";
        return false;
      }

      if (poolType === PoolType.ComposableStable && !amplification) {
        errors[3] = "Amplification factor is required for stable pools.";
        return false;
      }

      if (swapFeeIsInvalid) {
        errors[3] = "Swap fee is invalid.";
        return false;
      }

      if (amplificationInvalid) {
        errors[3] = "Amplification factor is invalid.";
        return false;
      }

      return true;
    })(),

    // Step 4: Set info
    (() => {
      if (!poolName) {
        errors[4] = "Pool name cannot be empty.";
        return false;
      }

      if (!poolSymbol) {
        errors[4] = "Pool symbol cannot be empty.";
        return false;
      }

      return true;
    })(),
  ];

  return { steps, errors };
};

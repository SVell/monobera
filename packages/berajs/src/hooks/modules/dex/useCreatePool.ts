import { useMemo } from "react";
import {
  balancerPoolCreationHelper,
  beraTokenAddress,
  nativeTokenAddress,
} from "@bera/config";
import { bexSubgraphClient } from "@bera/graphql";
import {
  GetDedupedSubgraphPools,
  GetDedupedSubgraphPoolsQuery,
  SubgraphPoolFragment,
} from "@bera/graphql/dex/subgraph";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import useSWRImmutable from "swr/immutable";
import { formatUnits, keccak256, parseUnits } from "viem";

import { generatePoolName, generatePoolSymbol } from "~/utils/poolNamings";
import { wrapNativeTokens } from "~/utils/tokenWrapping";
import { balancerPoolCreationHelperAbi } from "~/abi";
import { ADDRESS_ZERO } from "~/config";
import { IContractWrite } from "~/hooks/useContractWrite";
import { Token, TokenInput } from "~/types";

const DEFAULT_WEIGHTS_DUPLICATION_THRESHOLD = 0.005;
const DEFAULT_POOL_CREATE_GAS_LIMIT = 7_920_027n; // NOTE: this is the metamask gas limit, in experiments we find we can easily use 75% of this.

interface UseCreatePoolProps {
  poolCreateTokens: Token[];
  initialLiquidityTokens: TokenInput[];
  normalizedWeights: bigint[]; // NOTE: if you pass weights that have off-by-1 errors pool create will fail (ex: 0.3 repeating)
  poolType: PoolType;
  swapFee: number;
  owner: string;
  poolSymbol: string;
  poolName: string;
  amplification: number;
  weightsDuplicationThreshold?: number;
  oracles: Oracle[]; // NOTE: the default state for oracles should be 0x0 address for each token with cache duration of ~100
}

interface UseCreatePoolReturn {
  generatedPoolName: string;
  generatedPoolSymbol: string;
  isDupePool: boolean;
  dupePool?: SubgraphPoolFragment | null;
  createPoolArgs: any;
  isLoadingPools: boolean;
  errorLoadingPools: boolean;
}

export enum OracleMode {
  None = "None",
  Custom = "Custom",
}

export interface Oracle {
  mode: OracleMode;
  address: string;
  tokenAddress: string;
  cacheDuration: number;
}

const createStablePoolArgs = (
  poolCreateTokens: Token[],
  initialLiquidityTokens: TokenInput[],
  swapFeePercentage: bigint,
  salt: string,
  poolName: string,
  poolSymbol: string,
  owner: string,
  amplification: number,
  oracles: Oracle[],
  gasLimit: bigint = DEFAULT_POOL_CREATE_GAS_LIMIT,
) => {
  // Map and sort pool creation token addresses NOTE: we should never see BERA in this array.
  const sortedPoolCreateAddresses = poolCreateTokens
    .map((token) => token.address.toLowerCase())
    .sort((a, b) => (a < b ? -1 : 1));

  const combinedData = sortedPoolCreateAddresses.map((address) => {
    // Match with initial liquidity tokens
    const liquidityToken = initialLiquidityTokens.find(
      (token) =>
        token.address.toLowerCase() === address ||
        (address === beraTokenAddress.toLowerCase() &&
          token.address.toLowerCase() === nativeTokenAddress),
    );

    const amountIn = liquidityToken
      ? parseUnits(liquidityToken.amount, liquidityToken.decimals)
      : 0n; // FIXME we need to throw errors from here if zipping fails.

    // Match with oracles
    const oracle = oracles.find(
      (oracle) => oracle.tokenAddress.toLowerCase() === address.toLowerCase(),
    );
    const rateProvider = oracle ? oracle.address : ADDRESS_ZERO;
    const cacheDuration = oracle ? BigInt(oracle.cacheDuration) : BigInt(100);

    return { amountIn, rateProvider, cacheDuration };
  });

  // Extract results into separate arrays
  const sortedAmountsIn = combinedData.map((data) => data.amountIn);
  const sortedRateProviders = combinedData.map((data) => data.rateProvider);
  const sortedCacheDurations = combinedData.map((data) => data.cacheDuration);

  // Determine if native token (BERA) is included, and if so calculate its value, that is the value of this tx
  const nativeTokenIndex = initialLiquidityTokens.findIndex(
    (token) => token.address.toLowerCase() === nativeTokenAddress,
  );
  const value =
    nativeTokenIndex !== -1
      ? parseUnits(
          initialLiquidityTokens[nativeTokenIndex].amount,
          initialLiquidityTokens[nativeTokenIndex].decimals,
        )
      : 0n;
  const joinWBERAPoolWithBERA = value > 0n;

  return {
    address: balancerPoolCreationHelper,
    abi: balancerPoolCreationHelperAbi,
    functionName: "createAndJoinStablePool",
    params: [
      poolName,
      poolSymbol,
      sortedPoolCreateAddresses,
      BigInt(amplification),
      sortedRateProviders,
      sortedCacheDurations,
      false, // Exempt from yield protocol fee NOTE: this should be false for stable pools if rate providers are 0x0
      swapFeePercentage,
      sortedAmountsIn,
      owner as `0x${string}`,
      salt,
      joinWBERAPoolWithBERA,
    ],
    value,
    gasLimit,
  } as IContractWrite<
    typeof balancerPoolCreationHelperAbi,
    "createAndJoinStablePool"
  >;
};

const createWeightedPoolArgs = (
  poolCreateTokens: Token[],
  initialLiquidityTokens: TokenInput[],
  normalizedWeights: bigint[],
  swapFeePercentage: bigint,
  salt: string,
  poolName: string,
  poolSymbol: string,
  owner: string,
  gasLimit: bigint = DEFAULT_POOL_CREATE_GAS_LIMIT,
) => {
  // When joining weighted pools with BERA, we allow it as a joinPoolToken but never as a createPoolToken.
  const createPoolTokens: string[] = [];
  const joinPoolTokens: string[] = [];
  const sortedWeights: bigint[] = [];
  const sortedAmountsIn: bigint[] = [];

  poolCreateTokens
    .map((token, index) => {
      return {
        createToken: token.address,
        joinToken: initialLiquidityTokens[index].address, // NOTE: this will allow native token as a join token
        weight: normalizedWeights[index],
        amountIn: parseUnits(
          initialLiquidityTokens[index].amount,
          initialLiquidityTokens[index].decimals,
        ),
      };
    })
    .sort((a, b) =>
      a.createToken.toLowerCase() < b.createToken.toLowerCase() ? -1 : 1,
    )
    .forEach((item) => {
      createPoolTokens.push(item.createToken);
      joinPoolTokens.push(item.joinToken);
      sortedWeights.push(item.weight);
      sortedAmountsIn.push(item.amountIn);
    });

  // Determine if native token (BERA) is involved and calculate its value, that is the value of this tx
  const nativeTokenIndex = joinPoolTokens.indexOf(nativeTokenAddress);
  const value =
    nativeTokenIndex !== -1 ? sortedAmountsIn[nativeTokenIndex] : 0n;

  return {
    address: balancerPoolCreationHelper,
    abi: balancerPoolCreationHelperAbi,
    functionName: "createAndJoinWeightedPool",
    params: [
      poolName,
      poolSymbol,
      createPoolTokens,
      joinPoolTokens,
      sortedWeights,
      Array(createPoolTokens.length).fill(ADDRESS_ZERO),
      swapFeePercentage,
      sortedAmountsIn,
      owner as `0x${string}`,
      salt,
    ],
    value,
    gasLimit,
  } as IContractWrite<
    typeof balancerPoolCreationHelperAbi,
    "createAndJoinWeightedPool"
  >;
};

export const useCreatePool = ({
  poolCreateTokens,
  initialLiquidityTokens,
  normalizedWeights,
  poolType,
  poolName,
  poolSymbol,
  swapFee,
  owner,
  amplification,
  oracles,
  weightsDuplicationThreshold = DEFAULT_WEIGHTS_DUPLICATION_THRESHOLD,
}: UseCreatePoolProps): UseCreatePoolReturn => {
  // 1. identify if the pool is a duplicate
  const {
    data: dupePool,
    error: errorLoadingPools,
    isLoading: isLoadingPools,
  } = useSWRImmutable<SubgraphPoolFragment | null>(
    [
      "useCreatePool__deduped_pool",
      poolCreateTokens,
      poolType,
      normalizedWeights,
    ],
    async () => {
      if (poolCreateTokens.length === 0 || !poolType) {
        return null;
      }
      try {
        // NOTE: it should not be possible for native token to be in poolCreateTokens
        const tokensSorted = wrapNativeTokens(poolCreateTokens)
          .map((token) => token.address.toLowerCase())
          .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));

        // fetch pools of the same type as the one we are creating
        const res = await bexSubgraphClient.query<GetDedupedSubgraphPoolsQuery>(
          {
            query: GetDedupedSubgraphPools,
            variables: {
              tokens: tokensSorted,
              type: poolType,
            },
          },
        );

        const matchingPools = res.data.pools.filter((pool) => {
          return pool.tokens?.every((token) =>
            poolType === PoolType.Weighted
              ? // in weighted pools, a dupe is if tokens and weights match within tolerance FIXME: we aren't getting weighted pools returned here
                tokensSorted.includes(token.address) &&
                Math.abs(
                  Number(token.weight) -
                    Number(
                      formatUnits(
                        normalizedWeights[tokensSorted.indexOf(token.address)],
                        18,
                      ),
                    ),
                ) < weightsDuplicationThreshold
              : // in composable pools a dupe is if the tokens match, handling that the LP token is in the tokens list
                tokensSorted.includes(token.address) ||
                token.address === pool.address,
          );
        });

        return matchingPools?.at(0) ?? null;
      } catch (error) {
        return null;
      }
    },
  );

  // Generated names
  const { generatedPoolName, generatedPoolSymbol } = useMemo(() => {
    if (!poolCreateTokens) {
      return {
        generatedPoolName: "",
        generatedPoolSymbol: "",
      };
    }
    const generatedPoolName = generatePoolName(poolCreateTokens);
    const generatedPoolSymbol = generatePoolSymbol(
      poolCreateTokens,
      normalizedWeights,
      poolType,
    );

    return {
      generatedPoolName,
      generatedPoolSymbol,
    };
  }, [poolCreateTokens, normalizedWeights, poolType]);

  // Pool create tx
  const createPoolArgs = useMemo(() => {
    if (
      !owner ||
      poolName === "" ||
      poolSymbol === "" ||
      poolCreateTokens.length !== initialLiquidityTokens.length ||
      poolCreateTokens.length === 0
    ) {
      return null;
    }

    const swapFeePercentage = parseUnits(swapFee.toString(), 16);
    const salt = keccak256(Buffer.from(`${poolName}-${owner}`));

    if (poolType === PoolType.Weighted) {
      return createWeightedPoolArgs(
        poolCreateTokens,
        initialLiquidityTokens,
        normalizedWeights,
        swapFeePercentage,
        salt,
        poolName,
        poolSymbol,
        owner,
      );
    }

    if (
      poolType === PoolType.ComposableStable ||
      poolType === PoolType.MetaStable
    ) {
      return createStablePoolArgs(
        poolCreateTokens,
        initialLiquidityTokens,
        swapFeePercentage,
        salt,
        poolName,
        poolSymbol,
        owner,
        amplification,
        oracles,
      );
    }

    return null;
  }, [
    poolCreateTokens,
    initialLiquidityTokens,
    normalizedWeights,
    poolType,
    swapFee,
    poolName,
    poolSymbol,
    owner,
    amplification,
    oracles,
  ]);

  return {
    generatedPoolName,
    generatedPoolSymbol,
    isDupePool: !!dupePool,
    dupePool,
    createPoolArgs,
    isLoadingPools,
    errorLoadingPools,
  };
};

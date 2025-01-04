import { useCallback, useEffect, useRef, useState } from "react";
import {
  getErrorMessage,
  tryMatchBalancerErrorCode,
  useBeraJs,
} from "@bera/berajs";
import { chainId, jsonRpcUrl } from "@bera/config";
import {
  PoolState,
  PriceImpact,
  PriceImpactAmount,
  RemoveLiquidity,
  RemoveLiquidityKind,
  RemoveLiquidityQueryOutput,
  Slippage,
} from "@berachain-foundation/berancer-sdk";
import { Address, ContractFunctionExecutionError } from "viem";

export interface UseRemoveLiquidityArgs {
  pool: PoolState | undefined;
}

export const useRemoveLiquidity = ({ pool }: UseRemoveLiquidityArgs) => {
  const { account } = useBeraJs();

  const [kind, setKind] = useState<RemoveLiquidityKind>(
    RemoveLiquidityKind.Proportional,
  );

  const [error, setError] = useState<{
    error?: unknown;
    balanceError?: string;
    message?: string;
  }>();

  const [wethIsEth, setWethIsEth] = useState(false);
  const [bptIn, setBptIn] = useState<bigint>(0n);
  const [_delayedBptIn, setDelayedBptIn] = useState<bigint>(0n);
  const [tokenOut, setTokenOut] = useState<Address>();
  const [priceImpact, setPriceImpact] = useState<PriceImpactAmount>();
  const [isLoading, setIsLoading] = useState(false);

  const [queryOutput, setQueryOutput] = useState<RemoveLiquidityQueryOutput>();

  const timeout = useRef<NodeJS.Timeout>();

  const fetch = useCallback(async () => {
    if (!pool || !_delayedBptIn || !tokenOut) return;

    setIsLoading(true);

    const removeLiquidity = new RemoveLiquidity();

    let queryOutput;
    let _priceImpact;

    try {
      if (kind === RemoveLiquidityKind.Proportional) {
        queryOutput = await removeLiquidity.query(
          {
            chainId: chainId,
            kind,
            rpcUrl: jsonRpcUrl,
            bptIn: {
              address: pool.address,
              decimals: 18,
              rawAmount: _delayedBptIn,
            },
          },
          pool,
        );
      } else if (kind === RemoveLiquidityKind.SingleTokenExactIn) {
        [queryOutput, _priceImpact] = await Promise.all([
          removeLiquidity.query(
            {
              chainId: chainId,
              kind,
              rpcUrl: jsonRpcUrl,
              bptIn: {
                address: pool.address,
                decimals: 18,
                rawAmount: _delayedBptIn,
              },
              tokenOut: tokenOut,
            },
            pool,
          ),
          PriceImpact.removeLiquidity(
            {
              chainId: chainId,
              kind,
              rpcUrl: jsonRpcUrl,
              tokenOut,
              bptIn: {
                address: pool.address,
                decimals: 18,
                rawAmount: _delayedBptIn,
              },
            },
            pool,
          ),
        ]);
      }

      setPriceImpact(_priceImpact);
      setQueryOutput(queryOutput);
      setError(undefined);
    } catch (error) {
      setPriceImpact(undefined);
      setQueryOutput(undefined);

      if (
        typeof error === "object" &&
        error !== null &&
        // @ts-expect-error
        error.shortMessage
      ) {
        const e = error as ContractFunctionExecutionError;
        setError({
          error: error,
          balanceError: tryMatchBalancerErrorCode(e?.shortMessage),
          message: getErrorMessage(error),
        });
      } else {
        setError({ message: String(error), error });
      }
    } finally {
      setIsLoading(false);
    }
  }, [pool, _delayedBptIn, kind, tokenOut]);

  useEffect(() => {
    setQueryOutput(undefined);
  }, [kind]);

  useEffect(() => {
    setIsLoading(true);
    timeout.current = setTimeout(() => {
      setDelayedBptIn(bptIn);
    }, 100);

    return () => clearTimeout(timeout.current);
  }, [bptIn]);

  useEffect(() => {
    setTokenOut(pool?.tokens?.at(0)?.address);
  }, [pool]);

  const getCallData = useCallback(
    (slippage: number) => {
      if (!queryOutput) throw new Error("Query output is not set");

      if (!pool) throw new Error("Pool is not set");

      const removeLiquidity = new RemoveLiquidity();

      return removeLiquidity.buildCall({
        ...queryOutput,
        chainId,
        recipient: account,
        sender: account,
        poolId: pool.id,
        wethIsEth,
        slippage: Slippage.fromPercentage(slippage.toString() as `${number}`),
      });
    },
    [queryOutput, pool, account, wethIsEth],
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    bptIn,
    setBptIn,
    error,
    kind,
    setKind,
    tokenOut,
    setTokenOut,
    queryOutput,
    priceImpact,
    getCallData,
    wethIsEth,
    setWethIsEth,
    isLoading,
  };
};

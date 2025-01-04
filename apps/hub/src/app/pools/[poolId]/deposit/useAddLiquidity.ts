import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, tryMatchBalancerErrorCode } from "@bera/berajs";
import { chainId, jsonRpcUrl } from "@bera/config";
import {
  AddLiquidity,
  AddLiquidityInput,
  AddLiquidityKind,
  AddLiquidityQueryOutput,
  PoolState,
  PriceImpact,
  PriceImpactAmount,
  Slippage,
} from "@berachain-foundation/berancer-sdk";
import { Address, ContractFunctionExecutionError, parseUnits } from "viem";

export interface UseAddLiquidityArgs {
  pool: PoolState | undefined;
  wethIsEth: boolean;
}

export type AddLiquidityError = {
  error?: unknown;
  balanceError?: `BAL#${string}`; // NOTE: we drill these into the UI so we can display addLiquidity-specific messages there.
  message?: string;
};

export const useAddLiquidity = ({ pool, wethIsEth }: UseAddLiquidityArgs) => {
  const [type, setType] = useState<AddLiquidityKind>(
    AddLiquidityKind.Unbalanced,
  );

  const [input, setInput] = useState<
    {
      address: Address;
      amount: string;
    }[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AddLiquidityError>();

  const [priceImpact, setPriceImpact] = useState<PriceImpactAmount>();

  const [queryOutput, setQueryOutput] = useState<AddLiquidityQueryOutput>();

  const fetch = useCallback(async () => {
    if (!pool || !input) return;

    if (input.length === 0) {
      setQueryOutput(undefined);
      return;
    }

    setIsLoading(true);

    try {
      let addLiquidityInput: AddLiquidityInput;
      const addLiquidity = new AddLiquidity();

      if (type === AddLiquidityKind.Unbalanced) {
        if (
          input.some(
            (i) => pool.tokens.findIndex((t) => t.address === i.address) === -1,
          )
        ) {
          throw new Error("Some input tokens are not in the pool");
        }

        addLiquidityInput = {
          chainId,
          kind: AddLiquidityKind.Unbalanced,
          rpcUrl: jsonRpcUrl,
          amountsIn: pool.tokens
            .filter(
              (t) => input.findIndex((i) => i.address === t.address) !== -1,
            )
            .map((t) => {
              const i = input.find((i) => i.address === t.address)!;
              return {
                rawAmount: parseUnits(i.amount, t.decimals),
                decimals: t?.decimals,
                address: i.address as Address,
              };
            }),
        };
      } else {
        const singleInput = input.at(0);

        if (!singleInput) {
          throw new Error("Input is empty");
        }

        const tokenInput = pool.tokens.find(
          (t) => t.address === singleInput.address,
        );

        if (!tokenInput) {
          throw new Error("Input token is not in the pool");
        }

        addLiquidityInput = {
          chainId,
          kind: AddLiquidityKind.Proportional,
          rpcUrl: jsonRpcUrl,
          referenceAmount: {
            rawAmount: parseUnits(singleInput.amount, tokenInput.decimals),
            decimals: tokenInput?.decimals,
            address: singleInput.address as Address,
          },
        };
      }

      const [queryOutput, priceImpact] = await Promise.all([
        addLiquidity.query(addLiquidityInput, pool),
        addLiquidityInput.kind === AddLiquidityKind.Unbalanced
          ? PriceImpact.addLiquidityUnbalanced(addLiquidityInput, pool)
          : undefined,
      ]);

      process.env.NODE_ENV === "development" &&
        console.log({ queryOutput, priceImpact });

      setError(undefined);
      setPriceImpact(priceImpact);
      setQueryOutput(queryOutput);
    } catch (error) {
      console.error("Error", error);
      if (
        typeof error === "object" &&
        error !== null &&
        // @ts-expect-error
        error.shortMessage
      ) {
        const e = error as ContractFunctionExecutionError;
        setError({
          error: e,
          balanceError: tryMatchBalancerErrorCode(e?.shortMessage),
          message: getErrorMessage(e),
        });
      } else {
        setError({ message: String(error), error });
      }
    } finally {
      setIsLoading(false);
    }
  }, [pool, input, type]);

  const getCallData = useCallback(
    ({ slippage, sender }: { slippage: number; sender: Address }) => {
      if (!queryOutput) throw new Error("Query output is not set");

      if (!pool) throw new Error("Pool is not set");

      const addLiquidity = new AddLiquidity();

      return addLiquidity.buildCall({
        ...queryOutput,
        chainId,
        sender,
        poolId: pool.id,
        recipient: sender,
        wethIsEth,
        slippage: Slippage.fromPercentage(slippage.toString() as `${number}`),
      });
    },
    [queryOutput, pool, wethIsEth],
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    getCallData,
    queryOutput,
    priceImpact,
    isLoading,
    type,
    setType,
    input,
    setInput,
    error,
  };
};

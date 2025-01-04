import { SwapRequest, useBeraJs, type DefaultHookOptions } from "@bera/berajs";
import { beraTokenAddress, chainId } from "@bera/config";
import { useDeadline } from "@bera/shared-ui";
import {
  Address,
  MAX_UINT256,
  Path,
  Slippage,
  SorHop,
  SorRoute,
  SorSwapResult,
  Swap,
  SwapBuildOutputExactIn,
  SwapBuildOutputExactOut,
  SwapKind,
  Token,
  TokenAmount,
  ZERO_ADDRESS,
} from "@berachain-foundation/berancer-sdk";
import { TRANSACTION_MODE } from "node_modules/@bera/shared-ui/src/settings";
import useSWR from "swr";
import { formatUnits } from "viem";
import { usePublicClient } from "wagmi";

import { DEFAULT_DEADLINE } from "~/utils/constants";
import { balancerApi, nativeToken } from "./b-sdk";

type IUsePollSwapsArgs = SwapRequest;
interface IUsePollSwapsOptions extends DefaultHookOptions {
  isTyping?: boolean | undefined;
}

// NOTE: isLoading and error are injected by SWR so we dont need to define them here
export interface SwapInfoV4 {
  swapKind: SwapKind;
  expectedAmountOut: TokenAmount;
  amountIn: TokenAmount;
  expectedAmountOutFormatted: string;
  amountInFormatted: string;
  buildCall: (
    slippagePercent: number,
  ) => SwapBuildOutputExactIn | SwapBuildOutputExactOut;
  swapPaths: Path[];
  routes: SorRoute[];
  priceImpactPercentage?: number; // NOTE: if there is an error calculating this (less critical) information, we log an error but dont throw
}

// NOTE: this is used when generating typings
function getEmptyResponse(): SwapInfoV4 {
  return {
    swapPaths: [] as Path[],
    swapKind: SwapKind.GivenIn,
    routes: [
      {
        share: "0",
        tokenIn: ZERO_ADDRESS,
        tokenInAmount: "0",
        tokenOut: ZERO_ADDRESS,
        tokenOutAmount: "0",
        hops: [] as SorHop[],
      } as SorRoute,
    ],
    expectedAmountOut: TokenAmount.fromHumanAmount(nativeToken, "0"),
    amountIn: TokenAmount.fromHumanAmount(nativeToken, "0"),
    expectedAmountOutFormatted: "0",
    amountInFormatted: "0",
    priceImpactPercentage: 0,
    buildCall: (slippagePercent: number) =>
      ({
        swapAmount: BigInt(0),
        returnAmount: BigInt(0),
        amountIn: BigInt(0),
        amountOut: BigInt(0),
        swapKind: SwapKind.GivenIn,
        assets: [],
        encodedCallData: "0x",
        gasEstimate: BigInt(0),
        to: ZERO_ADDRESS,
        callData: "0x",
        value: BigInt(0),
        minAmountOut: TokenAmount.fromHumanAmount(nativeToken, "0"),
      } as SwapBuildOutputExactIn),
  };
}

function convertZeroToWrapped(address: Address): Address {
  // NOTE: if we were using sdk v2's findRouteGivenIn it would handle this, but we are doing a raw fetchSorSwapPaths call
  return address.toLowerCase() === ZERO_ADDRESS ? beraTokenAddress : address;
}

const isZero = (amount: string) =>
  (!Number.isNaN(Number(amount)) && Number(amount) === 0) ||
  amount.trim() === "";

/**
 * Polls a pair for the optimal route and amount for a swap using Balancer SDK
 */
export const usePollBalancerSwap = (
  args: IUsePollSwapsArgs,
  options?: IUsePollSwapsOptions,
) => {
  const {
    tokenIn,
    tokenOut,
    amount,
    tokenInDecimals,
    tokenOutDecimals,
    isWrap, // NOTE: this will effectively mean we do not execute the query as wrapping is distinct from swapping.
    wberaIsBera, // NOTE: if true we will do wrapping in vault contract.
  } = args;

  const publicClient = usePublicClient();
  const { account, config: beraConfig } = useBeraJs();
  const { deadline, deadlineMode } = useDeadline();

  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY =
    !publicClient ||
    !account ||
    !config ||
    !tokenIn ||
    !tokenOut ||
    !tokenInDecimals ||
    !tokenOutDecimals ||
    isWrap || // NOTE: we dont do a query when we are doing a straight wrap, price is always 1:1 and its done differently.
    isZero(amount) || // TODO: it would be nice to strengthen the string formatting for inputs
    options?.isTyping
      ? null // Prevent fetching when required data is missing
      : [tokenIn, tokenOut, amount, deadline];

  return useSWR<SwapInfoV4>(
    QUERY_KEY,
    async () => {
      try {
        if (options?.isTyping) {
          return getEmptyResponse();
        }
        if (!publicClient || !account || !config) {
          throw new Error("Missing public client, account, or config");
        }
        // NOTE: when we are finding paths we need to use always ERC20 (wrapped) addresses.
        const tokenInV3 = new Token(
          chainId,
          convertZeroToWrapped(tokenIn),
          tokenInDecimals ?? 18,
        );
        const tokenOutV3 = new Token(
          chainId,
          convertZeroToWrapped(tokenOut),
          tokenOutDecimals ?? 18,
        );
        const tokenAmount = TokenAmount.fromHumanAmount(
          tokenInV3,
          amount as `${number}`, // TODO: we should firm up the typing for amount, but it's actually a large-ish refactor
        );
        const swapKind = SwapKind.GivenIn;

        // Fetch paths using Balancer API
        // TODO: if the V3 SDK brings back swap.findRouteGivenIn we might want to use that interface instead
        const {
          paths: sorPaths,
          priceImpact,
          routes,
        }: SorSwapResult = await balancerApi.sorSwapPaths.fetchSorSwapPaths({
          chainId,
          tokenIn: tokenInV3.address,
          tokenOut: tokenOutV3.address,
          swapKind,
          swapAmount: tokenAmount,
        });

        console.log("PRICE IMPACT", priceImpact);
        console.log("ROUTES", routes);

        if (!sorPaths || sorPaths.length === 0) {
          throw new Error(
            `No swap paths returned from Balancer API between ${tokenInV3.address} and ${tokenOutV3.address}`,
          );
        }

        const swapInput = {
          chainId,
          paths: sorPaths,
          swapKind,
          userData: "0x" as `0x${string}`,
        };

        const swap = new Swap(swapInput);
        const queryOutput = await swap.query(publicClient.transport.url);

        if (queryOutput.swapKind !== SwapKind.GivenIn) {
          throw new Error("Swap kind is not GivenIn");
        }

        if (!queryOutput.expectedAmountOut) {
          throw new Error("No path amounts returned");
        }

        if (priceImpact.error) {
          console.error("Swap price impact error", priceImpact);
        }
        let priceImpactPercentage = 0;
        try {
          priceImpactPercentage = Number(priceImpact.priceImpact) * 100;
        } catch (e) {
          console.error("Swap price impact casting error", e);
        }

        // NOTE: we are building this call here to set the deadline to 30 seconds from the time we return the object
        return {
          swapPaths: sorPaths,
          ...queryOutput,
          priceImpactPercentage: priceImpact.error
            ? undefined
            : priceImpactPercentage
            ? priceImpactPercentage
            : undefined,
          routes,
          expectedAmountOutFormatted: formatUnits(
            queryOutput.expectedAmountOut.amount,
            tokenOutDecimals,
          ),
          amountInFormatted: formatUnits(
            queryOutput.amountIn.amount,
            tokenInDecimals,
          ),
          buildCall: (slippagePercent: number) =>
            swap.buildCall({
              slippage: Slippage.fromPercentage(
                slippagePercent.toString() as `${number}`,
              ),
              deadline:
                deadlineMode === TRANSACTION_MODE.INFINITY
                  ? MAX_UINT256
                  : BigInt(
                      Math.round(Date.now() / 1000) +
                        (deadline ? deadline : DEFAULT_DEADLINE),
                    ),
              queryOutput,
              sender: account,
              recipient: account,
              wethIsEth: wberaIsBera,
            }),
        } satisfies SwapInfoV4;
      } catch (e: any) {
        // NOTE: we are throwing errors but logging them here because SWR doesnt handle errors well
        console.error(e);
        throw e;
      }
    },
    {
      ...options?.opts,
    },
  );
};

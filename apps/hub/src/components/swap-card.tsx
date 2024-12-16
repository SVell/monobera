"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BGT_ABI,
  IContractWrite,
  // Vault
  // @ts-ignore - ignore Token typing import error
  Token,
  TransactionActionType,
  balancerVaultAbi,
  getErrorMessage,
  useBeraJs,
  useBgtUnstakedBalance,
  usePollWalletBalances,
  useTokens,
  wberaAbi,
} from "@bera/berajs";
import {
  balancerVaultAddress,
  beraTokenAddress,
  bgtTokenAddress,
  honeyAddress,
  nativeTokenAddress,
} from "@bera/config";
import {
  ActionButton,
  AddTokenDialog,
  ApproveButton,
  BREAKPOINTS,
  TokenInput,
  TooltipCustom,
  useAnalytics,
  useBreakpoint,
  useSlippage,
  useTxn,
} from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { Button } from "@bera/ui/button";
import { Card } from "@bera/ui/card";
import { Icons } from "@bera/ui/icons";
import { SwapBuildOutputExactIn } from "@berachain-foundation/berancer-sdk";
import {
  ContractFunctionArgs,
  ContractFunctionName,
  decodeFunctionData,
  formatUnits,
  isAddress,
  parseUnits,
} from "viem";

import { WRAP_TYPE, useSwap } from "~/hooks/useSwap";
import { SwapCardHeader } from "./swap-card-header";
import { SwapCardInfo } from "./swap-card-info";
import { SwapRoute } from "./swap-route";

const DynamicPreview = dynamic(() => import("./preview-dialog"), {
  loading: () => (
    <Button className="w-full gap-1">
      Preview <Icons.arrowRight className="h-3 w-3" />
    </Button>
  ),
  ssr: false,
});

const Connect = dynamic(
  () => import("@bera/shared-ui").then((mod) => mod.ConnectButton),
  {
    ssr: false,
    loading: () => (
      <Button className="w-full gap-2 text-lg font-semibold">
        <Icons.wallet className={"h-6 w-6"} />
        Connect Wallet
      </Button>
    ),
  },
);

interface ISwapCard {
  inputCurrency?: string | null;
  outputCurrency?: string | null;
  isRedeem: boolean;
  addTokensOnLoad?: boolean;
  className?: string;
}

export function SwapCard({
  inputCurrency = nativeTokenAddress,
  outputCurrency = honeyAddress,
  isRedeem,
  className,
}: ISwapCard) {
  const slippage = useSlippage();

  const {
    setSelectedFrom,
    selectedFrom,
    allowance,
    selectedTo,
    fromAmount,
    setFromAmount,
    swapAmount,
    toAmount,
    error,
    setToAmount,
    setSelectedTo,
    setSwapAmount,
    onSwitch,
    setIsTyping,
    swapInfo,
    isRouteLoading,
    refreshAllowance,
    exchangeRate,
    gasEstimateInBera: estimatedBeraFee,
    gasPrice,
    tokenInPrice,
    tokenOutPrice,
    isWrap,
    wrapType,
    differenceUSD,
    setInputAddTokenDialogOpen,
    setOutputAddTokenDialogOpen,
    inputAddTokenDialogOpen,
    outputAddTokenDialogOpen,
    pendingInputToken,
    pendingOutputToken,
  } = useSwap({
    inputCurrency: inputCurrency
      ? isAddress(inputCurrency)
        ? inputCurrency
        : nativeTokenAddress
      : nativeTokenAddress,
    outputCurrency: outputCurrency
      ? isAddress(outputCurrency)
        ? outputCurrency
        : honeyAddress
      : honeyAddress,
    isRedeem: isRedeem,
  });

  // NOTE: we need to build a swap call to obtain the min amount out per balancer v3 SDK
  const [minAmountOut, setMinAmountOut] = useState<string | undefined>(
    undefined,
  );
  useEffect(() => {
    if (swapInfo?.swapPaths?.length) {
      const call = swapInfo.buildCall(slippage ?? 0) as SwapBuildOutputExactIn;
      setMinAmountOut(
        formatUnits(call.minAmountOut.amount, selectedFrom?.decimals ?? 18),
      );
    }
  }, [swapInfo]);

  const { account } = useBeraJs();
  const { captureException, track } = useAnalytics();

  const {
    refresh,
    isLoading: isBalancesLoading,
    useSelectedWalletBalance,
  } = usePollWalletBalances();

  const safeFromAmount =
    Number(fromAmount) > Number.MAX_SAFE_INTEGER
      ? Number.MAX_SAFE_INTEGER
      : Number(fromAmount) ?? 0;

  const safeSwapAmount =
    Number(swapAmount) > Number.MAX_SAFE_INTEGER
      ? Number.MAX_SAFE_INTEGER
      : Number(swapAmount) ?? 0;

  const { isConnected } = useBeraJs();
  const [exceedingBalance, setExceedingBalance] = useState(false);

  const [openPreview, setOpenPreview] = useState(false);

  // fetch user's native BERA balance
  const nativeTokenBalanceData = useSelectedWalletBalance(nativeTokenAddress);
  const nativeTokenBalance = nativeTokenBalanceData?.formattedBalance
    ? Number.parseFloat(nativeTokenBalanceData.formattedBalance)
    : undefined;
  // show native gas warning if user is swapping more BERA than their balance minus the padded gas estimate, which is likely to fail or leave them unable to perform additional swaps
  const shouldShowNativeGasWarning =
    isConnected &&
    selectedFrom?.address === nativeTokenAddress &&
    fromAmount &&
    nativeTokenBalance &&
    estimatedBeraFee &&
    nativeTokenBalance - estimatedBeraFee > 0 &&
    Number.parseFloat(fromAmount) < nativeTokenBalance &&
    Number.parseFloat(fromAmount) > nativeTokenBalance - estimatedBeraFee;

  const shouldShowGasBalanceWarning =
    isConnected &&
    nativeTokenBalance &&
    estimatedBeraFee &&
    nativeTokenBalance > 0 &&
    nativeTokenBalance - estimatedBeraFee < 0;

  // NOTE: this is a UX-friendly use-wrapper that executes the swap transation in L372
  const { write, isLoading, ModalPortal } = useTxn({
    actionType: TransactionActionType.SWAP,
    message: `Swap ${selectedFrom?.symbol} to ${selectedTo?.symbol}`,
    onSuccess: () => {
      if (!selectedFrom?.symbol || !selectedTo?.symbol) {
        captureException(new Error("swap_with_unknown_symbols"));
      } else if (!fromAmount || !toAmount) {
        captureException(new Error("swap_with_unknown_amounts"));
      } else {
        track("swap", {
          tokenFrom: selectedFrom.symbol,
          tokenTo: selectedTo.symbol,
          fromAmount: fromAmount,
          toAmount: toAmount,
        });
      }
      setFromAmount(undefined);
      setSwapAmount("");
      setToAmount(undefined);
      setOpenPreview(false);
      void refreshAllowance();
      refresh();
    },
    onSubmission: () => {
      setOpenPreview(false);
    },
    onError: (e: Error | undefined) => {
      track("swap_failed", {
        tokenFrom: selectedFrom?.symbol,
        tokenTo: selectedTo?.symbol,
      });
      captureException(new Error("swap_failed"), {
        data: {
          tokenFrom: selectedFrom?.symbol,
          tokenTo: selectedTo?.symbol,
          rawError: e,
        },
      });
      setOpenPreview(false);
    },
  });

  const {
    write: wrapWrite,
    isLoading: isWrapLoading,
    ModalPortal: WrapModalPortal,
  } = useTxn({
    message:
      wrapType === WRAP_TYPE.WRAP
        ? `Wrapping ${swapAmount} BERA to WBERA`
        : `Unwrapping ${swapAmount} WBERA to BERA`,
    actionType:
      wrapType === WRAP_TYPE.WRAP
        ? TransactionActionType.WRAP
        : TransactionActionType.UNWRAP,
    onSuccess: () => {
      track(
        wrapType === WRAP_TYPE.WRAP
          ? "wrap_bera_success"
          : "unwrap_wbera_success",

        { swapAmount },
      );
    },
    onSubmission: () => {
      setOpenPreview(false);
    },
    onError: (e: Error | undefined) => {
      track(
        wrapType === WRAP_TYPE.WRAP
          ? "wrap_bera_failed"
          : "unwrap_wbera_failed",

        { swapAmount },
      );
      captureException(
        wrapType === WRAP_TYPE.WRAP
          ? "wrap_bera_failed"
          : "unwrap_wbera_failed",
        {
          data: { swapAmount, rawError: e },
        },
      );
    },
  });

  const { data: bgtBalance, refresh: refreshBalance } = useBgtUnstakedBalance();
  const bgtFormattedBalance = bgtBalance ? bgtBalance.toString() : "0";

  const {
    write: redeemWrite,
    isLoading: isRedeemLoading,
    ModalPortal: RedeemModalPortal,
  } = useTxn({
    message: "Redeeming BGT for BERA",
    actionType: TransactionActionType.REDEEM_BGT,
    onError: () => {
      captureException("redeem_error");
    },
    onSuccess: () => {
      try {
        track("redeem", { fromAmount: fromAmount, toAmount: toAmount });
      } catch (e) {
        captureException(e);
      }
      refreshBalance();
      setFromAmount("");
      setToAmount("");
    },
  });

  const getSwapButton = () => {
    if (isRedeem) {
      return (
        <Button
          className="w-full"
          disabled={
            fromAmount === "" ||
            fromAmount === "0" ||
            hasInsufficientBalanceError ||
            isRedeemLoading
          }
          onClick={() => {
            redeemWrite({
              address: bgtTokenAddress,
              abi: BGT_ABI,
              functionName: "redeem",
              params: [
                account!,
                parseUnits(
                  fromAmount === "" || !fromAmount ? "0" : fromAmount,
                  18,
                ),
              ],
            });
          }}
        >
          Redeem
        </Button>
      );
    }
    if (
      (Number(allowance?.formattedAllowance) ?? 0) < (safeFromAmount ?? 0) &&
      !exceedingBalance &&
      !isWrap &&
      !isRouteLoading &&
      swapInfo?.swapPaths?.length !== 0 &&
      !error
    ) {
      return (
        <ApproveButton
          amount={parseUnits(
            (fromAmount ?? "0") as `${number}`,
            selectedFrom?.decimals ?? 18,
          )}
          token={selectedFrom}
          spender={balancerVaultAddress}
        />
      );
    }
    if (isConnected) {
      if (isWrap) {
        return (
          <Button
            className="w-full"
            disabled={isWrapLoading}
            onClick={() => {
              wrapWrite({
                address: beraTokenAddress,
                abi: wberaAbi,
                functionName:
                  wrapType === WRAP_TYPE.WRAP ? "deposit" : "withdraw",
                params:
                  wrapType === WRAP_TYPE.WRAP
                    ? []
                    : [parseUnits(`${safeSwapAmount}`, 18)],
                value:
                  wrapType === WRAP_TYPE.WRAP
                    ? parseUnits(`${safeSwapAmount}`, 18)
                    : 0n,
              });
            }}
          >
            {wrapType}
          </Button>
        );
      }
      if (swapInfo !== undefined) {
        return (
          <DynamicPreview
            swapInfo={swapInfo}
            disabled={
              swapInfo?.expectedAmountOut.amount === 0n ||
              exceedingBalance ||
              Number(fromAmount) <= 0 ||
              Number(toAmount) <= 0
            }
            priceImpact={swapInfo?.priceImpactPercentage}
            exchangeRate={exchangeRate}
            tokenIn={selectedFrom}
            tokenOut={selectedTo}
            tokenInPrice={tokenInPrice}
            tokenOutPrice={tokenOutPrice}
            open={openPreview}
            setOpen={setOpenPreview}
            write={() => {
              const calldata = swapInfo.buildCall(slippage ?? 0);
              // NOTE: the decode and write here is a kludge to avoid re-writing the way the balancer SDK builds txs so we can simulate
              const decodedData = decodeFunctionData({
                abi: balancerVaultAbi,
                data: calldata.callData,
              });

              write({
                address: calldata.to,
                abi: balancerVaultAbi,
                functionName: decodedData.functionName as ContractFunctionName<
                  typeof balancerVaultAbi,
                  "payable" | "nonpayable"
                >,
                params: decodedData.args as ContractFunctionArgs<
                  typeof balancerVaultAbi,
                  "payable" | "nonpayable"
                >,
                value: calldata.value,
              });
            }}
            isLoading={isLoading}
            minAmountOut={minAmountOut ?? "n/a"}
          />
        );
      }
      return (
        <DynamicPreview
          swapInfo={swapInfo}
          disabled={true}
          priceImpact={0}
          exchangeRate={exchangeRate}
          tokenIn={selectedFrom}
          tokenOut={selectedTo}
          tokenInPrice={tokenInPrice}
          tokenOutPrice={tokenOutPrice}
          open={openPreview}
          setOpen={setOpenPreview}
          write={() => {
            // NOTE: we shouldn't allow a transaction if the query has not executed
          }}
          isLoading={isLoading}
          minAmountOut={"n/a"}
        />
      );
    }
    return <Connect />;
  };

  const hasInsufficientBalanceError =
    isConnected && exceedingBalance && !isBalancesLoading;

  const hasRouteNotFoundError =
    selectedFrom &&
    selectedTo &&
    swapInfo &&
    swapInfo?.swapPaths?.length === 0 &&
    fromAmount &&
    fromAmount !== "" &&
    swapAmount !== "0" &&
    swapAmount !== "" &&
    !isRouteLoading &&
    !isWrap;

  const gasPriceLabel = useMemo(() => {
    if (
      !gasPrice ||
      hasRouteNotFoundError ||
      !toAmount ||
      !fromAmount ||
      !selectedTo ||
      !selectedFrom ||
      error !== undefined ||
      isRouteLoading
    )
      return "-";
    if (gasPrice < 0.01) return "<$0.01";
    return `$${gasPrice.toFixed(2)}`;
  }, [
    toAmount,
    fromAmount,
    selectedTo,
    selectedFrom,
    gasPrice,
    hasRouteNotFoundError,
    error,
    isRouteLoading,
  ]);
  const breakpoint = useBreakpoint();

  const { addNewToken } = useTokens();

  if (error !== undefined) {
    console.error("usePollBalancer resolved with an error!", error, swapInfo);
  }

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      {ModalPortal}
      {WrapModalPortal}
      {RedeemModalPortal}
      <AddTokenDialog
        token={pendingInputToken}
        onAddToken={() => {
          addNewToken(pendingInputToken as Token);
          setSelectedFrom(pendingInputToken);
          setInputAddTokenDialogOpen(false);
        }}
        open={inputAddTokenDialogOpen}
        onOpenChange={setInputAddTokenDialogOpen}
      />
      <AddTokenDialog
        token={pendingOutputToken}
        onAddToken={() => {
          addNewToken(pendingOutputToken as Token);
          setSelectedTo(pendingOutputToken);
          setOutputAddTokenDialogOpen(false);
        }}
        open={outputAddTokenDialogOpen}
        onOpenChange={setOutputAddTokenDialogOpen}
      />
      <div className="w-full">
        <div className="flex w-full flex-col gap-4">
          <Card className="w-full border-none">
            <SwapCardHeader isRedeem={isRedeem} />
            <div className="mt-3 rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1">
                <ul
                  className={cn("divide-border-y divide-y rounded-2xl")}
                  role="list"
                >
                  <TokenInput
                    className="px-0"
                    selected={selectedFrom}
                    selectedTokens={[selectedFrom, selectedTo]}
                    onTokenSelection={setSelectedFrom}
                    amount={fromAmount ?? ""}
                    price={Number(tokenInPrice)}
                    showExceeding={true}
                    setIsTyping={(isTyping: boolean) => setIsTyping(isTyping)}
                    onExceeding={(isExceeding: boolean) =>
                      setExceedingBalance(isExceeding)
                    }
                    setAmount={(amount) => {
                      // setSwapKind(SwapKind.GivenIn);
                      if (isRedeem) {
                        setFromAmount(amount);
                        setToAmount(amount);
                      } else {
                        setSwapAmount(amount);
                        setFromAmount(amount);
                      }
                    }}
                    filteredTokenTags={["debt", "aToken", "rewardToken"]}
                    filteredSymbols={["BGT"]}
                    beraSafetyMargin={estimatedBeraFee}
                    balance={isRedeem ? bgtFormattedBalance : undefined}
                    selectable={!isRedeem}
                  />
                  <div className="relative px-8">
                    <div
                      className="absolute inset-0 flex w-full items-center justify-center px-8"
                      aria-hidden="true"
                    >
                      {!isRedeem && (
                        <Button
                          type="button"
                          variant={"outline"}
                          onClick={() => {
                            onSwitch();
                          }}
                          className="z-10 inline-flex h-6 w-6 items-center rounded-sm border-border bg-background p-0.5 text-sm font-semibold text-muted-foreground md:h-8 md:w-8 md:p-1"
                        >
                          <Icons.swap className="h-3 w-3 md:h-6 md:w-6" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <TokenInput
                    className="px-0"
                    selected={selectedTo}
                    selectedTokens={[selectedFrom, selectedTo]}
                    onTokenSelection={setSelectedTo}
                    amount={toAmount ?? ""}
                    price={Number(tokenOutPrice)}
                    hideMax={true}
                    disabled={true}
                    setAmount={(amount) => {
                      setToAmount(amount);
                    }}
                    difference={
                      isWrap ? undefined : error ? undefined : differenceUSD
                    }
                    showExceeding={false}
                    isActionLoading={isRouteLoading && !isWrap && !isRedeem}
                    beraSafetyMargin={estimatedBeraFee}
                    filteredTokenTags={[
                      "supply",
                      "debt",
                      "aToken",
                      "rewardToken",
                    ]}
                    filteredSymbols={["BGT", "aToken"]}
                    selectable={!isRedeem}
                  />
                </ul>
                {!!swapInfo?.priceImpactPercentage &&
                  swapInfo?.priceImpactPercentage > 10 &&
                  !isWrap && (
                    <TooltipCustom
                      anchor={
                        breakpoint !== undefined && breakpoint! > BREAKPOINTS.md
                          ? "right"
                          : "bottom-center"
                      }
                      position={
                        breakpoint !== undefined && breakpoint! > BREAKPOINTS.md
                          ? "left"
                          : "bottom-center"
                      }
                      tooltipContent={
                        <div className="w-[250px]">
                          <p className="space-y-3 text-xs text-muted-foreground">
                            <p>
                              A swap of this size may have a high price impact,
                              given the current liquidity in the pool.
                            </p>
                            <p>
                              There may be a large difference between the amount
                              of your input token and what you will receive in
                              the output token
                            </p>
                          </p>
                        </div>
                      }
                    >
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">
                          <Icons.tooltip className="mr-2 mt-[-4px] inline h-4 w-4" />
                          {`Price Impact Warning: ${swapInfo?.priceImpactPercentage?.toFixed(
                            2,
                          )}%`}
                        </AlertDescription>
                      </Alert>
                    </TooltipCustom>
                  )}
                {hasInsufficientBalanceError ? (
                  <Alert
                    variant="destructive"
                    className="items-center justify-center"
                  >
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      This amount exceeds your total balance
                    </AlertDescription>
                  </Alert>
                ) : (
                  false
                )}
                {error !== undefined &&
                  !hasInsufficientBalanceError && ( // NOTE: route not found is triggered by insuffucent balance
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription className="text-xs">
                        {getErrorMessage(error)}
                      </AlertDescription>
                    </Alert>
                  )}
                {hasRouteNotFoundError && (
                  <Alert variant="destructive">
                    <AlertTitle>
                      {" "}
                      <Icons.tooltip className="mt-[-4px] inline h-4 w-4" />{" "}
                      Route Not Found
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      No route found for this swap. Please try a different pair.
                    </AlertDescription>
                  </Alert>
                )}
                {shouldShowGasBalanceWarning && !hasInsufficientBalanceError ? (
                  <Alert variant="warning">
                    <AlertTitle>
                      {" "}
                      <Icons.tooltip className="mt-[-4px] inline h-4 w-4" /> Gas
                      Warning
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      Your BERA balance is running low.
                    </AlertDescription>
                  </Alert>
                ) : (
                  false
                )}
                {shouldShowNativeGasWarning ? (
                  <Alert variant="warning">
                    <AlertTitle className="mb-1">
                      {" "}
                      <Icons.tooltip className="mr-1 mt-[-4px] inline h-4 w-4" />
                      {"  "}
                      BERA Swap Amount Exceeds Gas Estimates
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {`This swap is either likely to fail due to insufficient
                      BERA left for gas, or you may be left with an insufficient
                      amount of BERA to perform additional transactions.
                      Consider reducing your swap amount below ${
                        Number.parseFloat(fromAmount) - estimatedBeraFee
                      }.`}
                    </AlertDescription>
                  </Alert>
                ) : (
                  false
                )}
                {!isWrap && !isRedeem && (
                  <SwapCardInfo
                    priceImpact={swapInfo?.priceImpactPercentage ?? 0} // FIXME: we should handle undefined in SwapCardInfo
                    exchangeRate={exchangeRate}
                    gasPrice={gasPriceLabel}
                  />
                )}
                {swapInfo?.swapPaths &&
                  swapInfo?.swapPaths.length > 0 &&
                  selectedFrom &&
                  selectedTo && (
                    <SwapRoute
                      swapInfo={swapInfo}
                      tokenIn={selectedFrom}
                      tokenOut={selectedTo}
                    />
                  )}
                <ActionButton>{getSwapButton()}</ActionButton>
              </div>
            </div>
          </Card>
          {isRedeem && (
            <Alert variant="default">
              <AlertTitle>
                {" "}
                <Icons.tooltip className="mt-[-4px] inline h-4 w-4" /> Heads up!
              </AlertTitle>
              <AlertDescription className="text-xs">
                Redeeming your BGT into BERA is an irreversible action.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Token, honeyFactoryAbi } from "@bera/berajs";
import { honeyFactoryAddress } from "@bera/config";
import {
  ApproveButton,
  ConnectButton,
  FormattedNumber,
  SSRSpinner,
  TokenInput,
} from "@bera/shared-ui";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { Button } from "@bera/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@bera/ui/card";
import { Icons } from "@bera/ui/icons";
import { Skeleton } from "@bera/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@bera/ui/tabs";
import { Address, formatUnits, parseUnits } from "viem";

import { usePsm } from "~/hooks/usePsm";
import { cn } from "@bera/ui";
import BigNumber from "bignumber.js";

export function SwapCard() {
  const [tabValue, setTabValue] = useState<"mint" | "burn">("mint");
  const {
    fee,
    isFeeLoading,
    payload,
    isReady,
    isLoading,
    selectedFrom,
    selectedTo,
    fromAmount,
    toAmount,
    isMint,
    fromBalance,
    toBalance,
    ModalPortal,
    honey,
    collateralList,
    needsApproval,
    exceedBalance,
    isTyping,
    isBadCollateral,
    isBasketModeEnabled,
    collateralWeights,
    setSelectedFrom,
    setSelectedTo,
    write,
    setFromAmount,
    setToAmount,
    setIsTyping,
    setGivenIn,
    setChangedAsset,
    onSwitch,
    refreshAllowances,
  } = usePsm();

  const resetAmounts = () => {
    const newFromAmounts: Record<Address, string | undefined> = {};
    const newToAmounts: Record<Address, string | undefined> = {};
    for (const key in fromAmount) {
      newFromAmounts[key as Address] = undefined;
      newToAmounts[key as Address] = undefined;
    }
    setFromAmount(newFromAmounts);
    setToAmount(newToAmounts);
  };

  const userFriendlyAmount = (
    amount: string | undefined,
  ): string | undefined => {
    if (!amount) return undefined;
    return new BigNumber(amount).decimalPlaces(2, 1).toString();
  };

  return (
    <div className="w-full">
      <Card className="relative z-10 m-auto block w-full max-w-[500px] bg-background shadow-2xl">
        {ModalPortal}
        <CardHeader className="pb-3">
          <CardTitle>
            <span>{isMint ? "Mint" : "Redeem"}</span>
            {isFeeLoading ? (
              <Skeleton className="absolute right-6 top-5 h-6 w-40" />
            ) : (
              <div className="absolute right-6 top-5 text-base font-medium text-muted-foreground">
                Static fee of <FormattedNumber value={fee ?? 0} percent />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={tabValue} value={tabValue} className="mb-3">
            <TabsList className="w-full">
              <TabsTrigger
                value={"mint"}
                className="flex-1 capitalize"
                onClick={() => {
                  setTabValue("mint");
                  if (!isMint) onSwitch();
                }}
              >
                Mint
              </TabsTrigger>
              <TabsTrigger
                value={"burn"}
                className="flex-1 capitalize"
                onClick={() => {
                  setTabValue("burn");
                  if (isMint) onSwitch();
                }}
              >
                Redeem
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-6">
            <ul className="relative">
              <div
                className={cn(
                  "border rounded-md",
                  isBasketModeEnabled ? "mb-4" : "rounded-b-none border-b-0",
                )}
              >
                <TokenInput
                  amount={userFriendlyAmount(
                    fromAmount[selectedFrom?.[0]?.address!],
                  )}
                  balance={fromBalance?.[0]}
                  selected={selectedFrom?.[0]}
                  selectable={selectedFrom?.[0]?.address !== honey?.address}
                  selectedTokens={
                    isBasketModeEnabled ? selectedFrom : [selectedFrom?.[0]]
                  }
                  customTokenList={collateralList}
                  showExceeding
                  setIsTyping={setIsTyping}
                  setAmount={(amount) => {
                    setChangedAsset(selectedFrom?.[0]?.address);
                    setGivenIn(true);
                    setFromAmount((prevAmount) => ({
                      ...prevAmount,
                      [selectedFrom?.[0]?.address!]: amount,
                    }));
                  }}
                  onTokenSelection={(token) => {
                    resetAmounts();
                    setSelectedFrom((prevToken) =>
                      token && prevToken
                        ? [
                            token,
                            ...prevToken.filter(
                              (t) => t.address !== token.address,
                            ),
                          ]
                        : [],
                    );
                  }}
                />
                {!!isBasketModeEnabled && tabValue === "mint" && (
                  <>
                    <hr />
                    <TokenInput
                      amount={userFriendlyAmount(
                        fromAmount[selectedFrom?.[1]?.address!],
                      )}
                      balance={fromBalance?.[1]}
                      selected={selectedFrom?.[1]}
                      selectable={selectedFrom?.[1]?.address !== honey?.address}
                      selectedTokens={selectedFrom}
                      customTokenList={collateralList}
                      showExceeding
                      setIsTyping={setIsTyping}
                      setAmount={(amount) => {
                        setChangedAsset(selectedFrom?.[1]?.address);
                        setGivenIn(true);
                        setFromAmount((prevAmount) => ({
                          ...prevAmount,
                          [selectedFrom?.[1]?.address!]: amount,
                        }));
                      }}
                      onTokenSelection={(token) => {
                        resetAmounts();
                        setSelectedFrom((prevToken) =>
                          token && prevToken
                            ? [
                                token,
                                ...prevToken.filter(
                                  (t) => t.address !== token.address,
                                ),
                              ]
                            : [],
                        );
                      }}
                    />
                  </>
                )}
              </div>
              {(isLoading || isTyping) && (
                <SSRSpinner className="absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] rounded-md border border-border bg-background p-2" />
              )}
              <div
                className={cn(
                  "border rounded-md",
                  !isBasketModeEnabled && "rounded-t-none",
                )}
              >
                <TokenInput
                  amount={userFriendlyAmount(
                    toAmount[selectedTo?.[0]?.address!],
                  )}
                  balance={toBalance?.[0]}
                  selected={selectedTo?.[0]}
                  selectable={selectedTo?.[0]?.address !== honey?.address}
                  selectedTokens={
                    isBasketModeEnabled ? selectedTo : [selectedTo?.[0]]
                  }
                  customTokenList={collateralList}
                  showExceeding={false}
                  hideMax={true}
                  hideBalance
                  setIsTyping={setIsTyping}
                  setAmount={(amount) => {
                    setChangedAsset(selectedTo?.[0]?.address);
                    setGivenIn(false);
                    setToAmount((prevAmount) => ({
                      ...prevAmount,
                      [selectedTo?.[0]?.address!]: amount,
                    }));
                  }}
                  onTokenSelection={(token) => {
                    resetAmounts();
                    setSelectedTo((prevToken) =>
                      token && prevToken
                        ? [
                            token,
                            ...prevToken.filter(
                              (t) => t.address !== token.address,
                            ),
                          ]
                        : [],
                    );
                  }}
                />
                {!!isBasketModeEnabled && tabValue === "burn" && (
                  <>
                    <hr />
                    <TokenInput
                      amount={userFriendlyAmount(
                        toAmount[selectedTo?.[1]?.address!],
                      )}
                      balance={toBalance?.[1]}
                      selected={selectedTo?.[1]}
                      selectable={selectedTo?.[1]?.address !== honey?.address}
                      selectedTokens={selectedTo}
                      customTokenList={collateralList}
                      hideBalance
                      showExceeding
                      setIsTyping={setIsTyping}
                      setAmount={(amount) => {
                        setChangedAsset(selectedTo?.[1]?.address);
                        setGivenIn(false);
                        setToAmount((prevAmount) => ({
                          ...prevAmount,
                          [selectedTo?.[1]?.address!]: amount,
                        }));
                      }}
                      onTokenSelection={(token) => {
                        resetAmounts();
                        setSelectedTo((prevToken) =>
                          token && prevToken
                            ? [
                                token,
                                ...prevToken.filter(
                                  (t) => t.address !== token.address,
                                ),
                              ]
                            : [],
                        );
                      }}
                    />
                  </>
                )}
              </div>
            </ul>
            {isBadCollateral && !isBasketModeEnabled ? (
              <Alert variant="default" className="flex gap-2">
                <Icons.info className="text-default-foreground h-4 w-4 flex-shrink-0" />
                <div>
                  <AlertTitle className="text-destructive-foreground">
                    Selected token disabled
                  </AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    Selected token is currently disabled
                  </AlertDescription>
                </div>
              </Alert>
            ) : isBasketModeEnabled ? (
              <Alert variant="default" className="flex gap-2">
                <Icons.info className="text-default-foreground h-4 w-4 flex-shrink-0" />
                <div>
                  <AlertTitle className="text-destructive-foreground">
                    Minting is currently restricted to preset pairs
                  </AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    Restrictions in effect due to price volatility.
                  </AlertDescription>
                </div>
              </Alert>
            ) : (
              <></>
            )}
            {!isReady ? (
              <ConnectButton className="w-full" />
            ) : needsApproval.length > 0 &&
              !exceedBalance?.some((item) => item) ? (
              <ApproveButton
                token={needsApproval[0]}
                spender={honeyFactoryAddress}
                amount={parseUnits(
                  needsApproval[0].amount.toString() ?? "0",
                  needsApproval[0].decimals ?? 18,
                )}
                onApproval={() => refreshAllowances()}
              />
            ) : (
              <Button
                disabled={
                  isLoading ||
                  Object.values(fromAmount).every((item) => item === "0") ||
                  Object.values(toAmount).every((item) => item === "0") ||
                  exceedBalance?.some((item) => item) ||
                  isTyping ||
                  (!isBasketModeEnabled && isBadCollateral) ||
                  !payload
                }
                onClick={() => {
                  write({
                    address: honeyFactoryAddress,
                    abi: honeyFactoryAbi,
                    functionName: isMint ? "mint" : "redeem",
                    params: payload!,
                  });
                }}
              >
                {isMint ? "Mint" : "Redeem"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

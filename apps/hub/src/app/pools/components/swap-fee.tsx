"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@bera/ui";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { Input } from "@bera/ui/input";
import { PoolType } from "@berachain-foundation/berancer-sdk";

interface SwapFeeInputProps {
  poolType: PoolType;
  onFeeChange: (fee: number) => void;
  initialFee: number;
  predefinedFees?: number[];
  onInvalidSwapFee: (isInvalid: boolean) => void;
}

/**
 * The default minimum fee that can be set for a swap (percentage amount).
 * @constant
 * @type {number}
 */
const DEFAULT_MINIMUM_FEE = 0.00001;

/**
 * The default maximum fee that can be set for a swap (percentage amount).
 * @constant
 * @type {number}
 */
const DEFAULT_MAXIMUM_FEE = 10;

/**
 * A component that allows the user to input a swap fee within a given range and with default fee buttons.
 */
export function SwapFeeInput({
  initialFee,
  onFeeChange,
  poolType,
  predefinedFees = [0.1, 0.2, 0.3],
  onInvalidSwapFee,
}: SwapFeeInputProps) {
  const [fee, setFee] = useState<number>(initialFee); // Last valid fee
  const [rawFee, setRawFee] = useState<string>(`${initialFee}%`); // User input
  const [isInvalid, setIsInvalid] = useState<boolean>(false); // Invalid state
  const [warnMessage, setWarnMessage] = useState<string | null>(null);

  const validateFee = (
    value: string,
  ): { valid: boolean; parsedValue?: number } => {
    const rawValue = value.replace("%", "");
    const parsedValue = parseFloat(rawValue);

    if (!Number.isNaN(parsedValue)) {
      if (
        parsedValue >= DEFAULT_MINIMUM_FEE &&
        parsedValue <= DEFAULT_MAXIMUM_FEE
      ) {
        return { valid: true, parsedValue };
      }
    }
    return { valid: false };
  };

  const handleFeeChange = (value: string) => {
    setRawFee(value); // Always update raw input
    const { valid, parsedValue } = validateFee(value);

    if (valid && parsedValue !== undefined) {
      setFee(parsedValue);
      onFeeChange(parsedValue);
      onInvalidSwapFee(false);
      setIsInvalid(false);
    } else {
      setIsInvalid(true);
      onInvalidSwapFee(true);
      setWarnMessage(null);
    }
  };

  const handleBlur = () => {
    const { valid, parsedValue } = validateFee(rawFee);
    if (!valid) {
      onInvalidSwapFee(true);
    } else {
      setRawFee(`${parsedValue}%`);
    }
  };

  const handlePredefinedFeeClick = (value: number) => {
    setFee(value);
    setRawFee(`${value}%`);
    onFeeChange(value);
    onInvalidSwapFee(false);
    setWarnMessage(null);
    setIsInvalid(false);
  };

  useEffect(() => {
    setWarnMessage(
      poolType === PoolType.Weighted && fee < predefinedFees[0]
        ? `It is not recommended to set the swap fee to below ${predefinedFees[0]}% for weighted pools`
        : null,
    );
  }, [poolType, fee]);

  return (
    <>
      <section
        className={cn(
          "flex w-full flex-col gap-6 rounded-md border",
          isInvalid
            ? "border-destructive-foreground text-destructive-foreground"
            : "border-border",
        )}
      >
        <div className="relative flex h-14 flex-row items-center gap-6 text-sm">
          <Input
            type="text"
            variant="black"
            value={rawFee}
            onChange={(e) => handleFeeChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter swap fee"
            className="w-full border-none bg-transparent pr-10 font-semibold"
            aria-label="Swap Fee Input"
          />
          <div className="flex gap-2 pr-4">
            {predefinedFees.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => handlePredefinedFeeClick(preset)}
                className={cn(
                  "h-8 w-12 rounded-xs border text-xs font-medium text-muted-foreground",
                  fee === preset ? "border-info-foreground" : "border-border",
                )}
                aria-label="Swap Fee Input"
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      </section>

      {isInvalid && (
        <Alert variant="destructive" className="mt-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Invalid fee. Ensure the entered fee is between 0.00001% and 10%.
          </AlertDescription>
        </Alert>
      )}

      {warnMessage && (
        <Alert variant="warning" className="mt-2">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{warnMessage}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

"use client";

import React, { useState } from "react";
import { cn } from "@bera/ui";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { InputWithLabel } from "@bera/ui/input";

import BeraTooltip from "~/components/bera-tooltip";

interface AmplificationInputProps {
  initialAmplification: number;
  onAmplificationChange: (value: number) => void;
  onInvalidAmplification: (isInvalid: boolean) => void;
  minAmplification?: number;
  maxAmplification?: number;
}

/**
 * A component that allows the user to input an amplification parameter within a valid range.
 */
export const AmplificationInput: React.FC<AmplificationInputProps> = ({
  initialAmplification,
  onAmplificationChange,
  onInvalidAmplification,
  minAmplification = 1,
  maxAmplification = 5000,
}) => {
  const [rawAmplification, setRawAmplification] = useState<string>(
    `${initialAmplification}`,
  );
  const [isInvalid, setIsInvalid] = useState<boolean>(false); // Invalid state

  const validateAmplification = (
    value: string,
  ): { valid: boolean; parsedValue?: number } => {
    const parsedValue = Number(value);
    if (
      !Number.isNaN(parsedValue) &&
      parsedValue >= minAmplification &&
      parsedValue <= maxAmplification
    ) {
      return { valid: true, parsedValue };
    }
    return { valid: false };
  };

  const handleAmplificationChange = (value: string) => {
    setRawAmplification(value); // Always update raw input
    const { valid, parsedValue } = validateAmplification(value);

    if (valid && parsedValue !== undefined) {
      onAmplificationChange(parsedValue);
      onInvalidAmplification(false);
      setIsInvalid(false);
    } else {
      setIsInvalid(true);
      onInvalidAmplification(true);
    }
  };

  const handleBlur = () => {
    const { valid, parsedValue } = validateAmplification(rawAmplification);
    if (!valid) {
      onInvalidAmplification(true);
    } else {
      setRawAmplification(`${parsedValue}`);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <InputWithLabel
          label="Amplification Factor"
          className={cn({
            "border-destructive-foreground text-destructive-foreground":
              isInvalid,
          })}
          variant="black"
          value={rawAmplification}
          onChange={(e) => handleAmplificationChange(e.target.value)}
          onBlur={handleBlur}
          maxLength={5}
          tooltip={
            <BeraTooltip
              size="lg"
              wrap
              text={`
                The Amplification Factor (A) controls how aggressively the pool reacts to price fluctuations. Higher A values 
                maintain tighter spreads for small imbalances but increase slippage during large deviations like depegs. 
                Conversely, lower A values permit price changes for smaller deviations, but lower efficiency. `}
            />
          }
        />
      </div>

      {isInvalid && (
        <Alert variant="destructive" className="mt-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Invalid amplification factor. Ensure it is between{" "}
            {minAmplification} and {maxAmplification}.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

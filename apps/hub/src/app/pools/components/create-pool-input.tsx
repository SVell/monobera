import React, { useEffect, useState } from "react";
import { Oracle, OracleMode, truncateDecimal, type Token } from "@bera/berajs";
import {
  beraTokenAddress,
  bgtTokenAddress,
  nativeTokenAddress,
} from "@bera/config";
import { SelectToken } from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import { Icons } from "@bera/ui/icons";
import { InputWithLabel } from "@bera/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bera/ui/select";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { formatUnits, parseUnits } from "viem";

type Props = {
  token: Token | undefined;
  selectedTokens: Token[];
  weight?: bigint;
  displayWeight?: boolean;
  displayRemove?: boolean;
  locked: boolean;
  index: number;
  selectable?: boolean;
  poolType: PoolType;
  oracle: Oracle;
  onTokenSelection: (token: Token | undefined) => void;
  onWeightChange: (index: number, newWeight: bigint) => void;
  onLockToggle: (index: number) => void;
  onRemoveToken: (index: number) => void;
  onOracleChange: (index: number, updates: Partial<Oracle>) => void;
};

export default function CreatePoolInput({
  token,
  selectedTokens,
  weight,
  displayWeight,
  displayRemove,
  locked,
  index,
  selectable = true,
  poolType,
  oracle,
  onTokenSelection,
  onWeightChange,
  onLockToggle,
  onRemoveToken,
  onOracleChange,
}: Props) {
  const [rawInput, setRawInput] = useState(
    weight ? formatUnits(weight < 0n ? 0n : weight, 16) : "0",
  );
  const [openOracleSelector, setOpenOracleSelector] = useState(false);

  // Make sure that the input values are updated when the weight changes
  useEffect(() => {
    if (weight !== undefined) {
      setRawInput(formatUnits(weight < 0n ? 0n : weight, 16));
    }
  }, [weight]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This lets the user type in numbers with a period character without sending invalid bigInt to usePoolWeights
    const inputValue = e.target.value;
    const numericCharacterCount = inputValue.replace(/[^0-9]/g, "").length;

    if (numericCharacterCount > 18) {
      return;
    }

    if ((inputValue.match(/\./g) || []).length > 1) {
      return;
    }

    setRawInput(inputValue);

    try {
      if (inputValue === "" || Number.isNaN(Number(inputValue))) return;

      const weightInBigInt = parseUnits(inputValue, 16);
      onWeightChange(index, weightInBigInt);
    } catch {
      // Ignore errors and keep the raw input value
    }
  };

  return (
    <div className="flex w-full items-center gap-2 rounded-md border border-border px-2 py-2">
      <SelectToken
        token={token}
        filter={[nativeTokenAddress, bgtTokenAddress]} // NOTE: it is never possible to create a pool with BERA, but you can add BERA as liquidity later
        selectable={selectable}
        onTokenSelection={(selectedToken: Token | undefined) =>
          onTokenSelection(selectedToken)
        }
        selectedTokens={selectedTokens}
        btnClassName="border-none overflow-clip"
      />

      {/* Weight Input */}
      <div className="ml-auto flex items-center gap-2">
        {displayWeight && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">%</span>
            <InputWithLabel
              variant="black"
              type="text"
              title={rawInput}
              value={truncateDecimal(rawInput, 3)}
              onChange={handleWeightChange}
              className="w-24 rounded-md border bg-transparent text-center text-white"
            />

            <button
              type="button"
              onClick={() => onLockToggle(index)}
              className="ml-2"
            >
              {locked ? (
                <Icons.lock className="h-4 w-4" />
              ) : (
                <Icons.unlock className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
        {poolType === PoolType.ComposableStable && oracle && (
          <div className="w-full max-w-xs">
            <Select
              value={oracle.mode}
              onValueChange={(value) =>
                onOracleChange(index, {
                  mode: value as OracleMode,
                  tokenAddress: token?.address,
                })
              }
            >
              <SelectTrigger className="w-full cursor-pointer border-border bg-background text-base font-medium text-secondary-foreground">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  className="cursor-pointer border-border text-base font-medium hover:bg-muted"
                  value={OracleMode.None}
                >
                  Standard
                </SelectItem>
                <SelectItem
                  className="cursor-pointer border-border text-base font-medium hover:bg-muted"
                  value={OracleMode.Custom}
                >
                  Oracle
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Remove Button */}
        {displayRemove && (
          <button
            type="button"
            onClick={() => onRemoveToken(index)}
            className="mx-2 hover:text-white focus:outline-none"
          >
            <Icons.xCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

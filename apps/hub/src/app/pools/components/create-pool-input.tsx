import React, { useEffect, useState } from "react";
import { type Token } from "@bera/berajs";
import {
  beraTokenAddress,
  bgtTokenAddress,
  nativeTokenAddress,
} from "@bera/config";
import { SelectToken } from "@bera/shared-ui";
import { Icons } from "@bera/ui/icons";
import { InputWithLabel } from "@bera/ui/input";
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
  onTokenSelection: (token: Token | undefined) => void;
  onWeightChange: (index: number, newWeight: bigint) => void;
  onLockToggle: (index: number) => void;
  onRemoveToken: (index: number) => void;
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
  onTokenSelection,
  onWeightChange,
  onLockToggle,
  onRemoveToken,
}: Props) {
  const [rawInput, setRawInput] = useState(
    weight ? formatUnits(weight < 0n ? 0n : weight, 16) : "0",
  );

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
        btnClassName="border-none"
      />

      {/* Weight Input */}
      <div className="ml-auto flex items-center gap-2">
        {displayWeight && (
          <div className="flex w-64 items-center gap-2">
            <span className="text-sm text-gray-400">%</span>
            <InputWithLabel
              variant="black"
              type="text"
              value={rawInput}
              onChange={handleWeightChange}
              className="w-48 rounded-md border bg-transparent text-center text-white"
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

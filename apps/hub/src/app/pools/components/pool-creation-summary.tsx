import { ReactNode, memo, useMemo } from "react";
import {
  PoolCreationStep,
  formatMaxLength,
  formatUsd,
  getSafeNumber,
  truncateHash,
  wrapNativeToken,
  type TokenInput,
} from "@bera/berajs";
import { SubgraphTokenInformations } from "@bera/berajs/actions";
import { TokenIcon } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { Address } from "viem";

import { OwnershipType } from "./parameters-input";

type SummaryRowProps = {
  label: string;
  value?: ReactNode;
};

const SummaryRow = memo(({ label, value }: SummaryRowProps) => (
  <div className="flex w-full justify-between gap-4">
    <div className={cn("w-fit text-left", !value && "opacity-35")}>{label}</div>
    {value ? value : <div className="w-4 self-end opacity-35">--</div>}
  </div>
));
SummaryRow.displayName = "SummaryRow";

type TokenDisplayProps = {
  token: TokenInput;
  tokenPrices?: SubgraphTokenInformations;
};
const TokenDisplay = memo(({ token, tokenPrices }: TokenDisplayProps) => {
  if (!token.address) return null;
  const wrappedToken = wrapNativeToken(token); // NOTE: prices are always for WBERA, never BERA
  // TODO (BFE-409): we should bundle TokenInput and Price properly as token.usdValue
  return (
    <div className="flex flex-row justify-end gap-2 text-base xl:text-sm 2xl:text-base">
      <TokenIcon address={token.address} size="lg" />
      <div className="font-medium text-foreground">
        {formatMaxLength(Number(token.amount), 8)}
      </div>
      <div className="font-medium text-foreground">{token.symbol}</div>
      <div className="font-normal text-muted-foreground">
        {tokenPrices?.[wrappedToken.address] &&
          `(${formatUsd(
            tokenPrices[wrappedToken.address] *
              getSafeNumber(wrappedToken.amount),
            12,
          )})`}
      </div>
    </div>
  );
});
TokenDisplay.displayName = "TokenDisplay";

type PoolCreationSummaryProps = {
  currentStep: PoolCreationStep;
  completedSteps: PoolCreationStep[];
  poolType?: PoolType;
  ownershipType?: OwnershipType;
  tokens?: TokenInput[];
  tokenPrices?: SubgraphTokenInformations;
  swapFee?: number;
  ownersAddress?: Address;
  name?: string;
  symbol?: string;
  className?: string;
};

const PoolCreationSummary = memo(
  ({
    currentStep,
    completedSteps,
    poolType,
    ownershipType,
    tokens,
    tokenPrices,
    swapFee,
    ownersAddress,
    name,
    symbol,
    className,
  }: PoolCreationSummaryProps) => {
    function showStep(previewStep: PoolCreationStep) {
      return completedSteps.includes(previewStep);
    }

    const summaryRows = useMemo(
      () => [
        {
          label: "Pool Type",
          value:
            showStep(PoolCreationStep.POOL_TYPE) && poolType ? (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border-2 px-2 text-center text-base xl:text-sm 2xl:text-base",
                  poolType === PoolType.ComposableStable &&
                    "border-green-500 bg-muted text-green-500",
                  poolType === PoolType.Weighted &&
                    "border-highlight bg-muted text-highlight",
                )}
              >
                <div
                  className={cn(
                    "h-1 w-1 rounded-full",
                    poolType === PoolType.ComposableStable && "bg-green-500",
                    poolType === PoolType.Weighted && "bg-highlight",
                  )}
                />
                <span>
                  {poolType === PoolType.ComposableStable ? "Stable" : poolType}
                </span>
              </div>
            ) : undefined,
        },
        {
          label: "Tokens",
          value:
            showStep(PoolCreationStep.SELECT_TOKENS) && tokens?.length ? (
              <div className="flex flex-col gap-2">
                {tokens.map((token, index) => (
                  <TokenDisplay
                    key={token.address + index}
                    tokenPrices={tokenPrices}
                    token={token}
                  />
                ))}
              </div>
            ) : undefined,
        },
        {
          label: "Swap Fee",
          value:
            showStep(PoolCreationStep.SET_PARAMETERS) &&
            swapFee &&
            `${swapFee}%`,
        },
        {
          label: "Owners Address",
          value:
            showStep(PoolCreationStep.SET_PARAMETERS) &&
            `${ownershipType} (${
              ownersAddress &&
              truncateHash(ownersAddress, undefined, undefined, true)
            })`,
        },
        // NOTE: strangely, in the final step you will see both what you are typing & and the preview at the same time.
        {
          label: "Name",
          value: currentStep === PoolCreationStep.SET_INFO && name,
        },
        {
          label: "Symbol",
          value: currentStep === PoolCreationStep.SET_INFO && symbol,
        },
      ],
      [poolType, tokens, swapFee, ownersAddress, name, symbol, completedSteps],
    );

    return (
      <div className={className}>
        <h2 className="mb-4 self-start text-xl font-semibold">Pool Summary</h2>
        <section className="flex h-fit w-full flex-col justify-between gap-y-2 rounded-sm border p-4 text-base xl:w-[350px] xl:text-sm 2xl:w-[400px] 2xl:text-base">
          {summaryRows.map((row, index) => (
            <div
              className="text-right font-medium"
              key={`${row.label}-${index}`}
            >
              <SummaryRow key={row.label} {...row} />
            </div>
          ))}
        </section>
      </div>
    );
  },
);
PoolCreationSummary.displayName = "PoolCreationSummary";

export default PoolCreationSummary;

import { ReactNode, memo, useMemo } from "react";
import {
  formatMaxLength,
  formatUsd,
  getSafeNumber,
  truncateHash,
  wrapNativeToken,
  type TokenInput,
} from "@bera/berajs";
import { SubgraphTokenInformations } from "@bera/berajs/actions";
import { TokenChip, TokenIcon } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { InputToken, PoolType } from "@berachain-foundation/berancer-sdk";
import { Address } from "viem";

type SummaryRowProps = {
  label: string;
  value?: ReactNode;
};

const SummaryRow = memo(({ label, value }: SummaryRowProps) => (
  <div className="flex w-full justify-between gap-4">
    <div className={cn("w-fit", !value && "opacity-35")}>{label}</div>
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
    <div className="flex flex-row justify-end gap-2">
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
  poolType?: PoolType;
  tokens?: TokenInput[];
  tokenPrices?: SubgraphTokenInformations;
  swapFee?: number;
  ownersAddress?: Address;
  name?: string;
  symbol?: string;
};

const PoolCreationSummary = memo(
  ({
    poolType,
    tokens,
    tokenPrices,
    swapFee,
    ownersAddress,
    name,
    symbol,
  }: PoolCreationSummaryProps) => {
    const summaryRows = useMemo(
      () => [
        {
          label: "Pool Type",
          value: poolType ? (
            <div className="flex items-center gap-2 rounded-full border-2 border-green-600 px-2 text-[#4ade80]">
              <div className="h-1 w-1 rounded-full bg-[#4ade80]" />
              <span>{poolType}</span>
            </div>
          ) : undefined,
        },
        {
          label: "Tokens",
          value: tokens?.length ? (
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
        { label: "Swap Fee", value: swapFee && `${swapFee}%` },
        {
          label: "Owners Address",
          value: ownersAddress && truncateHash(ownersAddress),
        },
        { label: "Name", value: name },
        { label: "Symbol", value: symbol },
      ],
      [poolType, tokens, swapFee, ownersAddress, name, symbol],
    );

    return (
      <div>
        <h2 className="mb-4 self-start text-xl font-semibold">Pool Summary</h2>
        <section className="flex h-fit min-w-[400px] flex-col justify-between gap-y-2 rounded-sm border p-4">
          {summaryRows.map((row, index) => (
            <div className="text-right font-medium">
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

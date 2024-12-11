import { truncateHash, type Token } from "@bera/berajs";
import { TokenChip, TokenIcon } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { Address } from "viem";
import { ReactNode, memo, useMemo } from "react";

type SummaryRowProps = {
  label: string;
  value?: ReactNode;
};

const SummaryRow = memo(({ label, value }: SummaryRowProps) => (
  <div className="w-full flex justify-between">
    <div className={cn("w-fit", !value && "opacity-35")}>{label}</div>
    {value ? value : <div className="w-4 self-end opacity-35">--</div>}
  </div>
));
SummaryRow.displayName = "SummaryRow";

type TokenDisplayProps = { token: Token; amount: number };
const TokenDisplay = memo(({ token, amount }: TokenDisplayProps) => {
  if (!token.address) return null;
  return (
    <TokenChip key={token.address + token.logoURI}>
      <TokenIcon address={token.address} size="md" />
      {amount} {token.symbol} {token.usdValue}
    </TokenChip>
  );
});
TokenDisplay.displayName = "TokenDisplay";

type PoolCreationSummaryProps = {
  poolType?: PoolType;
  tokens?: Token[];
  swapFee?: number;
  ownersAddress?: Address;
  name?: string;
  symbol?: string;
};

const PoolCreationSummary = memo(
  ({
    poolType,
    tokens,
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
            <div className="flex items-center border-2 border-green-600 rounded-full text-[#4ade80] px-2 gap-2">
              <div className="h-1 w-1 bg-[#4ade80] rounded-full" />
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
                  token={token}
                  amount={0}
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
        <h2 className="self-start text-xl font-semibold mb-4">Pool Summary</h2>
        <section className="rounded-sm border p-4 flex flex-col min-w-[400px] h-fit justify-between gap-y-2">
          {summaryRows.map((row, index) => (
            <SummaryRow key={row.label} {...row} />
          ))}
        </section>
      </div>
    );
  },
);
PoolCreationSummary.displayName = "PoolCreationSummary";

export default PoolCreationSummary;

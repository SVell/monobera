import { type Token } from "@bera/berajs";
import { TokenChip, TokenIcon } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { Address } from "viem";
import { ReactNode } from "react";

type SummaryRowProps = {
  label: string;
  value?: ReactNode;
};

const SummaryRow = ({ label, value }: SummaryRowProps) => (
  <div className="w-full flex">
    <div className={cn("w-full", !value && "opacity-35")}>{label}</div>
    {value ? value : <div className="w-4 opacity-35">--</div>}
  </div>
);

type PoolCreationSummaryProps = {
  poolType?: PoolType;
  tokens?: Token[];
  swapFee?: number;
  ownersAddress?: Address;
  name?: string;
  symbol?: string;
};

const TokenDisplay = ({ token }: { token: Token }) => {
  if (!token.address) return undefined;
  return (
    <TokenChip key={token.address}>
      <TokenIcon address={token.address} size="md" />
      {token.symbol}
    </TokenChip>
  );
};

const PoolCreationSummary = ({
  poolType,
  tokens,
  swapFee,
  ownersAddress,
  name,
  symbol,
}: PoolCreationSummaryProps) => {
  console.table(tokens);
  const summaryRows = [
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
          {tokens.map((token) => (
            <TokenDisplay key={token.address} token={token} />
          ))}
        </div>
      ) : undefined,
    },
    { label: "Swap Fee", value: swapFee },
    { label: "Owners Address", value: ownersAddress },
    { label: "Name", value: name },
    { label: "Symbol", value: symbol },
  ];

  return (
    <div>
      <h2 className="self-start text-xl font-semibold mb-4">Pool Summary</h2>
      <section className="rounded-sm border p-4 flex flex-col min-w-[400px] h-fit justify-between gap-y-2">
        {summaryRows.map((row, index) => (
          <SummaryRow key={index} {...row} />
        ))}
      </section>
    </div>
  );
};

export default PoolCreationSummary;

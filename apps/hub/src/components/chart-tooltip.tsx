import { truncateHash } from "@bera/berajs";
import { ApiRewardAllocationWeightFragment } from "@bera/graphql/pol/api";
import { GaugeIcon, MarketIcon } from "@bera/shared-ui";
import uniqolor from "uniqolor";
import { Address } from "viem";

export type CuttingBoardWeightMega = ApiRewardAllocationWeightFragment & {
  percentage: number;
  id: number;
};

export function ChartTooltip({
  gauge,
}: {
  gauge: CuttingBoardWeightMega | undefined;
}) {
  if (!gauge) return null;
  return (
    <div className="z-1000 flex min-w-[220px] gap-2 rounded-md border p-3 backdrop-blur-md">
      <div
        className="h-20 w-1 rounded-full"
        style={{ background: uniqolor(gauge.receiver).color }}
      />
      <div className="flex w-full flex-col justify-between whitespace-nowrap ">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 text-sm font-semibold leading-5">
            {(gauge.percentage * 100).toFixed(2)}%
            {/* <div className="text-sm font-normal leading-5 text-muted-foreground">
              <FormattedNumber value={gauge.amount} compact /> BGT
            </div> */}
          </div>
        </div>
        <div className="flex flex-col items-start justify-center gap-1">
          <div className="text-forgeound flex flex-row items-center gap-2 whitespace-nowrap font-bold leading-5">
            <GaugeIcon
              address={gauge.receiver as Address}
              overrideImage={gauge.receivingVault?.metadata?.logoURI ?? ""}
            />{" "}
            {gauge.receivingVault?.metadata?.name ??
              truncateHash(gauge.receiver)}
          </div>
          <div className="flex items-center gap-1 whitespace-nowrap text-xs leading-4 text-muted-foreground">
            <MarketIcon
              market={gauge.receivingVault?.metadata?.productName ?? ""}
              className="h-4 w-4"
            />{" "}
            {gauge.receivingVault?.metadata?.productName ?? "OTHER"}
          </div>
        </div>
      </div>
    </div>
  );
}

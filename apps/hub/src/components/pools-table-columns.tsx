"use client";

import { GqlPoolType, MinimalPoolInListFragment } from "@bera/graphql/dex/api";
import { TokenIconList, Tooltip } from "@bera/shared-ui";
import { Badge } from "@bera/ui/badge";
import { Icons } from "@bera/ui/icons";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bera/ui/tooltip";

export const poolTypeLabels: Record<any, string> = {
  [GqlPoolType.ComposableStable]: "Stable",
  [GqlPoolType.MetaStable]: "Meta Stable",
  [GqlPoolType.Weighted]: "Weighted",
};

export const PoolSummary = ({
  pool,
  isWhitelistedVault,
}: {
  pool: MinimalPoolInListFragment;
  isWhitelistedVault: boolean;
}) => {
  return (
    <div className="flex flex-row items-start gap-2">
      <TokenIconList
        tokenList={pool?.tokens.filter((t) => t.address !== pool.address)}
        size="xl"
        className="self-center"
      />
      <div className="flex flex-col items-start justify-start gap-1">
        <div className="flex flex-row items-center justify-start gap-1">
          <span className="flex w-fit max-w-[180px] flex-row gap-1 truncate text-left text-sm font-semibold">
            {pool?.name}
            {isWhitelistedVault && (
              <div title="This rewards vault is whitelisted" className="pt-1">
                <Icons.bgt className="h-4 w-4" />
              </div>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className=" text-xs text-muted-foreground">
            {pool.type in poolTypeLabels
              ? poolTypeLabels[pool.type]
              : pool.type}
          </span>
          <Badge
            variant={"secondary"}
            className="border-none px-2 py-1 text-[10px] leading-[10px] text-foreground"
          >
            <span>
              {(Number(pool?.dynamicData?.swapFee) * 100).toFixed(2)}%
            </span>
          </Badge>
          {pool.userBalance && pool.userBalance.walletBalance !== "0" && (
            <Badge
              variant="success"
              className="border-none bg-success px-2 py-1 text-[10px] leading-[10px] "
            >
              <span>Provided Liquidity</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

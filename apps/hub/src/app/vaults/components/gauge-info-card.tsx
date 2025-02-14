import React from "react";
import Link from "next/link";
import {
  truncateHash,
  useBlockTime,
  usePollGlobalData,
  type Validator,
} from "@bera/berajs";
import { FormattedNumber, ValidatorIcon } from "@bera/shared-ui";
import { getHubValidatorPath } from "@bera/shared-ui";
import { Icons } from "@bera/ui/icons";
import { Skeleton } from "@bera/ui/skeleton";

import { getValidatorEstimatedBgtPerYear } from "~/hooks/useValidatorEstimatedBgtPerYear";
import { Address } from "viem";

export default function GaugeInfoCard() {
  const { data: globalData, isLoading } = usePollGlobalData();

  const timePerBlock = useBlockTime();
  const blockCountPerYear = timePerBlock
    ? (60 * 60 * 24 * 365) / timePerBlock
    : 0;
  return (
    <div className="flex w-full flex-1 flex-col gap-6 sm:flex-row">
      <div className="flex flex-1 flex-row gap-6 sm:flex-col">
        <div className="flex flex-1 flex-col gap-2 rounded-lg border border-border px-4 py-6">
          <div className="text-sm font-medium leading-5 text-muted-foreground">
            Active Reward Vaults
          </div>
          {!isLoading ? (
            <span className="text-2xl font-semibold leading-8">
              {globalData?.activeRewardVaultCount}
            </span>
          ) : (
            <Skeleton className="h-8 w-[125px] " />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-lg border border-border px-4 py-6">
          <div className="text-sm font-medium leading-5 text-muted-foreground">
            Active Incentives
          </div>
          {!isLoading && globalData ? (
            <FormattedNumber
              value={globalData.sumAllIncentivesInHoney}
              symbol="USD"
              compact={false}
              compactThreshold={999_999_999}
              className="items-center text-xl font-bold leading-5"
            />
          ) : (
            <Skeleton className="h-8 w-[100px]" />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-row gap-6 sm:flex-col">
        <div className="flex flex-1 flex-col gap-2 rounded-lg border border-border px-4 py-6">
          <div className="text-sm font-medium leading-5 text-muted-foreground">
            Total Circulating BGT
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="flex items-center gap-1">
              <FormattedNumber
                value={globalData?.bgtTotalSupply ?? 0}
                compact={false}
                compactThreshold={999_999_999}
                className="items-center text-xl font-bold leading-5"
              />
              <Icons.bgt className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-lg border border-border px-4 py-6">
          <div className="text-sm font-medium leading-5 text-muted-foreground">
            BGT Distribution (Yearly)
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            // Get BGT emitted last day and multiply by 365
            <FormattedNumber
              value={0}
              compact={false}
              compactThreshold={999_999}
              symbol="BGT"
              className="items-center text-xl font-bold opacity-20 leading-5"
            />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 rounded-lg border border-border px-4 py-6">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium leading-5 text-muted-foreground">
            # Of Active Validators
          </div>
          {isLoading || !globalData ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-semibold">
              {" "}
              {globalData.validatorCount}{" "}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="text-xs font-medium uppercase leading-5 tracking-wider text-muted-foreground ">
            Top 3 Validators
          </div>
          {!isLoading && globalData ? (
            globalData.top3EmittingValidators?.map((validator, index) => (
              <Link
                className="cursor-pointer flex w-full flex-1 items-center gap-2 rounded-sm border border-border bg-background px-4 py-2"
                key={`${index}-${validator.id}`}
                href={getHubValidatorPath(validator.pubkey)}
                target="_blank"
              >
                <ValidatorIcon
                  address={validator.pubkey as Address}
                  size="xl"
                  imgOverride={validator.metadata?.logoURI}
                />
                <div>
                  <div className="text-nowrap text-sm font-semibold leading-5">
                    {validator?.metadata?.name ??
                      truncateHash(validator.pubkey)}
                  </div>
                  <FormattedNumber
                    value={getValidatorEstimatedBgtPerYear(
                      validator,
                      globalData.validatorCount,
                    )}
                    showIsSmallerThanMin
                    symbol="BGT/Year"
                    className="block text-nowrap text-[10px] font-medium leading-3 text-muted-foreground"
                  />
                </div>
              </Link>
            ))
          ) : (
            <>
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

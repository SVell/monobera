"use client";

import Image from "next/image";
import { usePollGlobalData } from "@bera/berajs";
import { cloudinaryUrl } from "@bera/config";
import { FormattedNumber } from "@bera/shared-ui";
import { Card } from "@bera/ui/card";
import { Skeleton } from "@bera/ui/skeleton";

export const ValidatorsGlobalInfo = () => {
  const { data, isLoading } = usePollGlobalData();
  const generalInfo = [
    {
      amount: (
        <FormattedNumber
          value={data?.validatorCount ?? 0}
          compact={false}
          visibleDecimals={0}
        />
      ),
      text: "Total Validators",
      img: (
        <div className="absolute bottom-0 right-0">
          <Image
            src={`${cloudinaryUrl}/station/validators`}
            alt="Total Validators"
            width={140}
            height={140}
          />
        </div>
      ),
    },
    {
      amount: (
        <FormattedNumber
          value={data?.bgtTotalBoosts ?? 0}
          symbol="BGT"
          showIsSmallerThanMin
        />
      ),
      text: "Total Value Staked",
      img: (
        <div className="absolute bottom-0 right-0">
          <Image
            src={`${cloudinaryUrl}/station/inflation`}
            alt="Inflation"
            width={80}
            height={80}
          />
        </div>
      ),
    },
    {
      amount: (
        <FormattedNumber
          value={data?.sumAllIncentivesInHoney ?? 0}
          symbol="USD"
        />
      ),
      text: "Total Active Incentives",
      img: (
        <div className="absolute bottom-0 right-0">
          <Image
            src={`${cloudinaryUrl}/station/incentives`}
            alt="Validator Incentives"
            width={100}
            height={100}
          />
        </div>
      ),
    },
    {
      amount: (
        <FormattedNumber
          value={data?.activeRewardVaultCount ?? 0}
          compact={false}
          visibleDecimals={0}
        />
      ),
      text: "Active Reward Vaults",
      img: (
        <div className="absolute bottom-0 right-0">
          <Image
            src={`${cloudinaryUrl}/station/active-gauges`}
            alt="Active Reward Vaults"
            width={100}
            height={100}
          />
        </div>
      ),
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {generalInfo.map((info, index) => (
        <Card
          className="relative h-[150px] border-border p-6 text-left"
          key={info.text + index}
        >
          <div className="text-sm font-medium leading-none text-muted-foreground pb-2">
            {info.text}
          </div>
          {isLoading ? (
            <Skeleton className="h-[45px] w-[120px]" />
          ) : (
            <div className="text-2xl font-semibold leading-loose text-foreground">
              {info.amount}
            </div>
          )}
          {info.img}
        </Card>
      ))}
    </div>
  );
};

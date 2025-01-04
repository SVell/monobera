import React, { useEffect } from "react";
import Link from "next/link";
import { truncateHash } from "@bera/berajs";
import { blockExplorerUrl } from "@bera/config";
import { FormattedNumber, Tooltip, ValidatorIcon } from "@bera/shared-ui";
import { Icons } from "@bera/ui/icons";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";
import { Address } from "viem";

export default function ValidatorDetails({
  validator,
}: {
  validator: ApiValidatorFragment | undefined;
}) {
  useEffect(() => {
    console.log({ validator });
  }, [validator]);

  const validatorDataItems = [
    {
      title: "BGT emitted",
      value: (
        <div className="text-xl font-semibold">
          <FormattedNumber
            value={validator?.dynamicData?.bgtEmittedAllTime ?? 0}
          />
        </div>
      ),
      tooltipText: "Amount of BGT emitted by this validator",
    },
    {
      title: "Bera staked",
      value: (
        <div className="text-xl font-semibold">
          <FormattedNumber
            value={validator?.dynamicData?.depositStakedAmount ?? 0}
          />
        </div>
      ),
      tooltipText: "Amount of BERA staked by this validator",
    },
    {
      title: "Boosted",
      value: (
        <span className="text-xl font-semibold">
          <FormattedNumber
            value={validator?.dynamicData?.amountDelegated ?? "10"}
            showIsSmallerThanMin
            symbol="BGT"
          />
        </span>
      ),
      tooltipText: "Amount of BGT boosted to this validator",
    },
    {
      title: "Website",
      value: (
        <span className="text-ellipsis text-xl font-semibold hover:underline">
          <Link href={validator?.metadata?.website ?? ""}>
            {validator?.metadata?.website ?? ""}
          </Link>
        </span>
      ),
      tooltipText: undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Link
        className="flex items-center gap-1 text-sm font-medium leading-[14px] text-muted-foreground hover:cursor-pointer"
        href="/validators"
      >
        <Icons.arrowLeft className="relative h-4 w-4" />
        Validators
      </Link>
      <div className="mt-2 flex w-full flex-col justify-between gap-6 border-b  border-border pb-6 lg:flex-row ">
        <div className="items-left w-full flex-col justify-evenly gap-4">
          <div className="flex w-full items-center justify-start gap-2 text-xl font-bold leading-[48px]">
            <ValidatorIcon
              address={validator?.pubkey as Address}
              className="h-12 w-12"
              imgOverride={validator?.metadata?.logoURI}
            />
            {validator?.metadata?.name ?? truncateHash(validator?.id ?? "")}
          </div>

          <div className="my-4 flex w-full flex-row gap-1 text-muted-foreground">
            Operator:
            <span className="flex flex-row gap-1 text-foreground hover:underline">
              <Link
                href={`${blockExplorerUrl}/address/${validator?.operator}`}
                target="_blank"
              >
                {truncateHash(validator?.operator ?? "")}
              </Link>
              <Icons.externalLink className="h-4 w-4 self-center" />
            </span>
          </div>
          <div className="w-full overflow-hidden text-ellipsis text-foreground">
            {validator?.metadata?.description ?? ""}
          </div>
        </div>
        <div className="items-left w-full flex-col justify-between gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {validatorDataItems.map((item, index) => (
              <div
                className="relative flex flex-col items-start justify-start"
                key={index}
              >
                <div className="flex flex-row items-center gap-1 text-muted-foreground">
                  {item.title}{" "}
                  {item.tooltipText && <Tooltip text={item.tooltipText} />}
                </div>
                <div className="mt-1 w-full overflow-hidden text-ellipsis text-foreground">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

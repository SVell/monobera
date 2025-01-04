import {
  useAllValidators,
  usePollValidatorAllBlockStats,
  useTokenHoneyPrices,
} from "@bera/berajs";
import { FormattedNumber, Tooltip } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { Card } from "@bera/ui/card";
import { Icons } from "@bera/ui/icons";
import { Skeleton } from "@bera/ui/skeleton";
import { type Address } from "viem";
import { UserBoosts } from "./UserBoosts";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";
import { useEffect, useState } from "react";
import { isSameAddress } from "@berachain-foundation/berancer-sdk";

export const ValidatorDataCard = ({
  title,
  value,
  tooltipText,
  className,
}: {
  title: string;
  value: React.ReactNode;
  tooltipText?: string | undefined;
  className?: string;
}) => {
  return (
    <Card className={cn(className, "p-5")}>
      <div className="flex w-full items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-foreground">
        {title}
        {tooltipText && <Tooltip text={tooltipText} />}
      </div>
      <div className="mt-2 text-foreground">{value}</div>
    </Card>
  );
};

export const ValidatorOverview = ({
  validator,
}: { validator: ApiValidatorFragment }) => {
  const activeIncentivesArray = validator.rewardAllocationWeights?.flatMap(
    (rv) => rv.receivingVault?.activeIncentives,
  );

  const [rank, setRank] = useState<{
    validatorRank: number;
    totalValidators: number;
    blockSigningRank: number;
    blocksSigned: number;
    totalBlocks: number;
  }>({
    validatorRank: -1,
    totalValidators: 0,
    blockSigningRank: -1,
    blocksSigned: 0,
    totalBlocks: 0,
  });

  const {
    data: allValidatorBlockData,
    isLoading: isLoadingAllValidatorBlockData,
  } = usePollValidatorAllBlockStats();

  const { data: allValidators, isLoading: isLoadingValidators } =
    useAllValidators();

  useEffect(() => {
    const totalValidators = allValidators?.validators?.validators?.length ?? 0;
    const valStakedRanking = allValidators?.validators?.validators?.findIndex(
      (v) => v.id === validator.id.toLowerCase(),
    );

    console.log({ allValidatorBlockData });

    const blocksSigned = allValidatorBlockData?.blockStatsByValidators?.reduce(
      (acc, v, idx) => {
        if (isSameAddress(v.validator.id, validator.id as Address)) {
          return {
            ...acc,
            rank: idx,
            blocksSigned: Number(v.blockCount),
            totalBlocks: acc.totalBlocks + Number(v.blockCount),
          };
        }

        return { ...acc, totalBlocks: acc.totalBlocks + Number(v.blockCount) };
      },
      {
        rank: -1,
        blocksSigned: 0,
        totalBlocks: 0,
      },
    );

    setRank({
      validatorRank: valStakedRanking ?? -1,
      totalValidators,
      blockSigningRank: blocksSigned?.rank ?? -1,
      blocksSigned: blocksSigned?.blocksSigned ?? 0,
      totalBlocks: blocksSigned?.totalBlocks ?? 0,
    });
  }, [validator.id, allValidatorBlockData, allValidators]);

  const activeIncentivesTokens = activeIncentivesArray?.filter(
    (incentive, index, array) =>
      incentive?.token &&
      incentive?.active &&
      array.findIndex(
        (i) => i?.token?.address === incentive?.token?.address,
      ) === index,
  );

  const { data: tokenHoneyPrices } = useTokenHoneyPrices({
    tokenAddresses: activeIncentivesTokens
      ?.map((t) => t?.token?.address)
      .filter((t) => t !== undefined) as Address[] | undefined,
  });

  const returnPerBgt: number = activeIncentivesArray?.reduce(
    (acc: number, ab) => {
      if (!ab) return acc;
      const tokenPrice = parseFloat(
        tokenHoneyPrices?.[ab.token.address] ?? "0",
      );
      return acc + Number(ab?.incentiveRate) * tokenPrice;
    },
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="flex flex-col gap-2">
        {/* TODO: Binary Version?!? */}
        {/* <div className="flex justify-end text-sm text-muted-foreground">
          {"Binary Version: V9.41"}
        </div> */}
        <div className="grid w-full grid-cols-1 gap-x-0 gap-y-4 md:grid-cols-2 md:gap-x-4">
          <ValidatorDataCard
            className="h-[130px]"
            title="Validator Ranking"
            value={
              <div className="flex flex-col items-start gap-1">
                <div className="relative flex w-full flex-row justify-between">
                  {isLoadingValidators || rank.validatorRank === -1 ? (
                    <Skeleton className="mt-1 h-8 w-40" />
                  ) : (
                    <span className="text-2xl font-semibold">
                      {rank.validatorRank === -1
                        ? "Unranked"
                        : `${rank.validatorRank + 1} of ${
                            rank.totalValidators
                          }`}
                    </span>
                  )}
                  <Icons.logo className="absolute right-0 h-16 w-16 self-center text-muted" />
                </div>
              </div>
            }
          />
          <ValidatorDataCard
            className="h-[130px]"
            title="Block Signing"
            value={
              <div className="flex flex-col items-start gap-1">
                <div className="relative flex w-full flex-row justify-between">
                  {isLoadingValidators ? (
                    <Skeleton className="mt-1 h-8 w-44" />
                  ) : (
                    <span className="text-2xl font-semibold">
                      {rank.blockSigningRank === -1
                        ? "Unranked"
                        : `${rank.blockSigningRank + 1} of ${
                            rank.totalValidators
                          }`}
                    </span>
                  )}
                  <Icons.cube className="absolute right-0 h-16 w-16 self-center text-muted" />
                </div>

                {isLoadingAllValidatorBlockData ||
                rank.blockSigningRank === -1 ? (
                  <Skeleton className="mt-1 h-4 w-full" />
                ) : (
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-foreground">
                    Last day:{" "}
                    <FormattedNumber
                      value={rank.blocksSigned}
                      compact
                      showIsSmallerThanMin
                    />{" "}
                    /{" "}
                    <FormattedNumber
                      value={rank.totalBlocks}
                      compact
                      showIsSmallerThanMin
                    />
                  </span>
                )}
              </div>
            }
          />
          <ValidatorDataCard
            className="h-[130px]"
            title="APY"
            value={
              <div className="flex flex-col items-start gap-1">
                <div className="relative flex w-full flex-row gap-1">
                  <FormattedNumber
                    value={0}
                    percent
                    className="text-2xl font-semibold opacity-20"
                  />
                </div>
              </div>
            }
          />
          <ValidatorDataCard
            className="h-[130px]"
            title="Est. Return per BGT"
            value={
              <div className="flex flex-row gap-1 text-2xl font-semibold opacity-20">
                $
                <FormattedNumber
                  value={returnPerBgt}
                  compact
                  showIsSmallerThanMin
                />
                <Icons.honey className="h-6 w-6 self-center" />
              </div>
            }
          />
        </div>
        {/* TODO: Uptime need work on beaconkit to add */}
        {/* <Uptime address={validator.id} /> */}
      </div>
      <UserBoosts validator={validator} />
    </div>
  );
};

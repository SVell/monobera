import React from "react";
import { Token, useTokenHoneyPrices } from "@bera/berajs";
import {
  FormattedNumber,
  TokenIcon,
  TokenIconList,
  Tooltip,
} from "@bera/shared-ui";
import { type Address } from "viem";
import { ApiVaultIncentiveFragment } from "@bera/graphql/pol/api";
import { Skeleton } from "@bera/ui/skeleton";

interface TotalValues {
  totalIncentives: number;
  amountPerProposal: number;
  tokenAmountPerProposal?: number;
}

interface TotalValues {
  totalIncentives: number;
  amountPerProposal: number;
  tokenAmountPerProposal?: number;
}

export const BribeTooltipRow = ({
  token,
  totalValues,
  isLoading,
}: {
  token: Token;
  totalValues: TotalValues;
  isLoading?: boolean;
}) => {
  return (
    <div className="flex justify-between">
      <div className="text-md flex flex-row gap-1">
        <TokenIcon address={token.address} size="lg" symbol={token.symbol} />
        {token.symbol}
      </div>
      <div className="text-md flex flex-row gap-1">
        {isLoading ? (
          <Skeleton className="h-4 w-10" />
        ) : (
          totalValues.amountPerProposal !== 0 && (
            <div className="text-muted-foreground">
              $
              <FormattedNumber value={totalValues.amountPerProposal} />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export const BribesTooltip = ({
  activeIncentive,
}: {
  activeIncentive: ApiVaultIncentiveFragment[];
}) => {
  const { data: tokenHoneyPrices, isLoading: isLoadingHoneyPrices } =
    useTokenHoneyPrices({
      tokenAddresses: activeIncentive.map(
        (ab) => ab.token.address,
      ) as Address[],
    });

  const totalBribesValue: TotalValues = activeIncentive.reduce(
    (acc: TotalValues, ab) => {
      const tokenPrice = parseFloat(
        tokenHoneyPrices?.[ab.token.address] ?? "0",
      );

      return {
        totalIncentives:
          acc.totalIncentives + Number(ab.amountRemaining) * tokenPrice,
        amountPerProposal:
          acc.amountPerProposal + Number(ab.incentiveRate) * tokenPrice,
      };
    },
    {
      totalIncentives: 0,
      amountPerProposal: 0,
    },
  );

  const others: TotalValues | undefined =
    activeIncentive.length > 5
      ? activeIncentive.reduce(
          (acc: TotalValues, ab) => {
            const tokenPrice = parseFloat(
              tokenHoneyPrices?.[ab.token.address] ?? "0",
            );
            return {
              totalIncentives:
                acc.totalIncentives + Number(ab.amountRemaining) * tokenPrice,
              amountPerProposal:
                acc.amountPerProposal + Number(ab.incentiveRate) * tokenPrice,
            };
          },
          {
            totalIncentives: 0,
            amountPerProposal: 0,
          },
        )
      : undefined;

  return (
    <div className="flex w-[250px] flex-col gap-1 p-1">
      {activeIncentive.map((ab, i) => {
        if (i > 4) {
          return;
        }
        const tokenPrice = parseFloat(
          tokenHoneyPrices?.[ab.token.address] ?? "0",
        );

        const bribeTotalValues: TotalValues = {
          totalIncentives: Number(ab.amountRemaining) * tokenPrice,
          amountPerProposal: Number(ab.incentiveRate) * tokenPrice,
          tokenAmountPerProposal: Number(ab.incentiveRate),
        };
        return (
          <BribeTooltipRow
            isLoading={isLoadingHoneyPrices}
            token={ab.token as Token}
            totalValues={bribeTotalValues}
            key={`${i}-BribeTooltipRow`}
          />
        );
      })}
      {others && (
        <BribeTooltipRow
          token={{
            address: "0x0",
            symbol: `Others (+${activeIncentive.length - 5})`,
            decimals: 18,
            name: "Others",
          }}
          totalValues={others}
        />
      )}
      <div className="h-1 w-full border-b" />
      <div className="flex flex-row justify-between">
        <div className="text-md text-muted-foreground">Total</div>
        <div className="text-md">
          $
          <FormattedNumber
            value={totalBribesValue.totalIncentives}
            compact
            showIsSmallerThanMin
          />
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <div className="text-md text-muted-foreground">Amount Per BGT</div>
        <div className="text-md">
          $
          <FormattedNumber
            value={totalBribesValue.amountPerProposal}
            compact
            showIsSmallerThanMin
          />
        </div>
      </div>
    </div>
  );
};

function reduceIncentives(
  incentives?: ApiVaultIncentiveFragment[],
): ApiVaultIncentiveFragment[] | undefined {
  return incentives
    ?.filter((i) => i!)
    .reduce<typeof incentives>((acc, curr) => {
      const prevPosition = acc.findIndex(
        (x) => x.tokenAddress === curr.tokenAddress,
      );

      if (prevPosition === -1) {
        return [...acc, curr];
      }

      const prevIncentive = { ...acc[prevPosition] };

      prevIncentive.amountRemaining = String(
        Number(prevIncentive.amountRemaining) + Number(curr.amountRemaining),
      );

      // FIXME: This is not correct, we need to check with quants
      prevIncentive.incentiveRate = String(
        Number(prevIncentive.incentiveRate) + Number(curr.incentiveRate),
      );
      acc[prevPosition] = prevIncentive;

      return acc;
    }, []);
}

export const BribesPopover = ({
  incentives,
}: {
  incentives: ApiVaultIncentiveFragment[] | undefined;
}) => {
  const reducedIncentives = reduceIncentives(incentives);

  return (
    <>
      {!incentives || incentives?.length === 0 ? (
        <div className="w-fit rounded-lg px-2 py-1 text-xs hover:bg-muted">
          No Incentives
        </div>
      ) : (
        <Tooltip
          toolTipTrigger={
            <div className="w-fit rounded-lg p-1 hover:bg-muted">
              <TokenIconList
                tokenList={
                  reducedIncentives?.map((i) => ({
                    ...i.token,
                    id: i.tokenAddress,
                  })) ?? []
                }
                showCount={3}
                size={"lg"}
                className="w-fit"
              />
            </div>
          }
          children={<BribesTooltip activeIncentive={reducedIncentives ?? []} />}
        />
      )}
    </>
  );
};

import { truncateHash, useTokenHoneyPrice } from "@bera/berajs";
import { beraTokenAddress } from "@bera/config";
import {
  DataTableColumnHeader,
  FormattedNumber,
  Tooltip,
  ValidatorIcon,
  bribeApyTooltipText,
} from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { type Address } from "viem";

import { ApiValidatorFragment, ApiVaultFragment } from "@bera/graphql/pol/api";
import { CuttingBoardDisplay } from "~/app/validators/components/ValidatorsTable";
import { BribesPopover } from "~/components/bribes-tooltip";
import { useValidatorEstimatedBgtPerYear } from "~/hooks/useValidatorEstimatedBgtPerYear";
import { ValidatorWithUserBoost } from "@bera/berajs/actions";

const VALIDATOR_COLUMN: ColumnDef<ApiValidatorFragment> = {
  header: "Validator",
  cell: ({ row }) => (
    <div className="flex items-center gap-1 overflow-hidden truncate">
      <ValidatorIcon
        address={row.original.id as Address}
        className="h-8 w-8 flex-shrink-0"
        imgOverride={row.original.metadata?.logoURI}
      />
      <span className="flex-grow truncate">
        {row.original.metadata?.name ?? truncateHash(row.original.pubkey)}
      </span>
    </div>
  ),
  minSize: 200,
  accessorKey: "name",
  enableSorting: false,
};

const GLOBAL_VOTING_POWER_COLUMN: ColumnDef<ApiValidatorFragment> = {
  header: "BGT Boosts",
  cell: ({ row }) => (
    <div className="w-full text-start">
      <FormattedNumber
        value={row.original.dynamicData?.amountDelegated ?? 0}
        compact={false}
        symbol="BGT"
      />
    </div>
  ),
  minSize: 200,

  accessorKey: "dynamicData.amountDelegated",

  sortingFn: (a, b) => {
    console.log({ a, b });

    return (
      Number(a.original.dynamicData?.amountDelegated) -
      Number(b.original.dynamicData?.amountDelegated)
    );
  },
  enableSorting: true,
};

const APY_COLUMN: ColumnDef<ApiValidatorFragment> = {
  header: "Capture",
  cell: ({ row }) => (
    <div className="flex h-full w-[91px] items-center">
      <FormattedNumber
        value={
          Number(row.original.dynamicData?.bgtCapturePercentage ?? 0) / 100
        }
        percent
      />
    </div>
  ),
  minSize: 150,
  meta: {
    tooltip: bribeApyTooltipText(),
    headerClassname: "flex-initial",
  },
  accessorKey: "dynamicData.bgtCapturePercentage",
  enableSorting: true,
};

const MOST_WEIGHTED_GAUGE_COLUMN: ColumnDef<ApiValidatorFragment> = {
  header: "Most Weighted Vault",
  cell: ({ row }) => {
    const cuttingBoards = [...(row.original.rewardAllocationWeights ?? [])];

    const mostWeightedCuttingBoard = cuttingBoards.sort(
      (a, b) => Number(b.percentageNumerator) - Number(a.percentageNumerator),
    )[0];
    return <CuttingBoardDisplay cuttingBoard={mostWeightedCuttingBoard} />;
  },
  accessorKey: "mostWeightedGauge",
  enableSorting: false,
};

const BRIBES_COLUMN: ColumnDef<ValidatorWithUserBoost> = {
  header: "Incentives",
  cell: ({ row }) => {
    return (
      <BribesPopover
        incentives={row.original.rewardAllocationWeights
          .filter((x) => x?.receivingVault)
          .flatMap((rv) => rv.receivingVault!.activeIncentives!)}
      />
    );
  },
  accessorKey: "bribes",
  enableSorting: false,
};

const CLAIMABLE_BRIBES_COLUMN: ColumnDef<ValidatorWithUserBoost> = {
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Incentives" />
  ),
  cell: ({ row }) => {
    return (
      <div className="flex flex-row items-center gap-1">
        <BribesPopover
          incentives={row.original.rewardAllocationWeights
            ?.filter((rv) => rv.receivingVault)
            .flatMap((rv) => rv.receivingVault!.activeIncentives!)}
        />
        <Tooltip
          text={"Claiming coming soon"}
          toolTipTrigger={
            <Button disabled size="sm">
              Claim
            </Button>
          }
        />
      </div>
    );
  },
  accessorKey: "bribes",
  enableSorting: false,
};

const USER_BOOSTED_COLUMN: ColumnDef<ValidatorWithUserBoost> = {
  header: ({ column }) => (
    <DataTableColumnHeader
      column={column}
      title="Boosts"
      className="whitespace-nowrap"
    />
  ),
  cell: ({ row }) => {
    return (
      <FormattedNumber
        showIsSmallerThanMin
        value={row.original.userBoosts.activeBoosts ?? 0}
        symbol="BGT"
      />
    );
  },
  accessorKey: "userBoosts.activeBoosts",
  sortingFn: (a, b) =>
    Number(a.original.userBoosts.activeBoosts) -
    Number(b.original.userBoosts.activeBoosts),
  enableSorting: true,
};

const USER_QUEUED_BOOSTS_COLUMN: ColumnDef<ValidatorWithUserBoost> = {
  header: ({ column }) => (
    <DataTableColumnHeader
      column={column}
      title="Queued Boosts"
      className="whitespace-nowrap"
    />
  ),
  cell: ({ row }) => {
    return (
      <FormattedNumber
        value={row.original.userBoosts?.queuedBoosts ?? 0}
        symbol="BGT"
      />
    );
  },
  accessorKey: "userBoosts.queuedBoosts",
  sortingFn: (a, b) =>
    Number(a.original.userBoosts?.queuedBoosts) -
    Number(b.original.userBoosts?.queuedBoosts),
  enableSorting: true,
};

const USER_QUEUED_DROP_BOOSTS_COLUMN: ColumnDef<ValidatorWithUserBoost> = {
  header: ({ column }) => (
    <DataTableColumnHeader
      column={column}
      title="Queued Unboosts"
      className="whitespace-nowrap"
    />
  ),
  cell: ({ row }) => {
    return (
      <FormattedNumber
        value={
          Number(row.original.userBoosts?.queuedUnboosts) > 0
            ? -row.original.userBoosts?.queuedUnboosts
            : 0
        }
        symbol="BGT"
        colored
      />
    );
  },
  accessorKey: "userBoosts.queuedUnboosts",
  sortingFn: (a, b) =>
    Number(a.original.userBoosts?.queuedUnboosts) -
    Number(b.original.userBoosts?.queuedUnboosts),
  enableSorting: true,
};

export const getGaugeValidatorColumns = (rewardVault: ApiVaultFragment) => {
  const gauge_validator_columns: ColumnDef<ApiValidatorFragment>[] = [
    VALIDATOR_COLUMN,
    {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="BGT Per Proposal"
          tooltip={
            "amount of BGT this validator is directing to this vault each proposal"
          }
        />
      ),
      cell: ({ row }) => {
        const { data: price } = useTokenHoneyPrice({
          tokenAddress: beraTokenAddress,
        });

        const cuttingBoard = row.original.rewardAllocationWeights.find(
          (cb: any) =>
            cb.receiver.toLowerCase() === rewardVault.address.toLowerCase(),
        );

        if (!cuttingBoard)
          return (
            <FormattedNumber
              className="w-full justify-start"
              symbol="BGT"
              compact={false}
              compactThreshold={999_999_999}
              value={0}
            />
          );
        const weight = cuttingBoard?.percentageNumerator / 1e5 ?? 0;
        const perProposal =
          weight * parseFloat(row.original.dynamicData?.rewardRate ?? "0");
        return (
          <div className="flex flex-col gap-1">
            <FormattedNumber
              value={perProposal}
              compact
              showIsSmallerThanMin
              symbol="BGT"
            />
            <span className="text-xs text-muted-foreground">
              <FormattedNumber
                value={perProposal * parseFloat(price ?? "0")}
                showIsSmallerThanMin
                symbol="USD"
              />
            </span>
          </div>
        );
      },
      accessorKey: "rewardRate",
      enableSorting: true,
    },
    {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Estimated BGT/yr"
          tooltip={
            "amount of BGT this validator is directing to this vault each proposal"
          }
        />
      ),
      cell: ({ row }) => {
        const { data: price } = useTokenHoneyPrice({
          tokenAddress: beraTokenAddress,
        });

        const cuttingBoard = row.original.rewardAllocationWeights.find(
          (cb: any) =>
            cb.receiver.toLowerCase() === rewardVault.address.toLowerCase(),
        );
        if (!cuttingBoard)
          return (
            <FormattedNumber
              className="w-full justify-start"
              symbol="BGT"
              compact={false}
              compactThreshold={999_999_999}
              value={0}
            />
          );
        const estimatedYearlyBgt = useValidatorEstimatedBgtPerYear(
          row.original,
        );
        const weight = cuttingBoard?.percentageNumerator / 10000;

        const estimatedAmountDirected = weight * estimatedYearlyBgt;
        return (
          <div className="flex flex-col gap-1">
            <FormattedNumber
              value={estimatedAmountDirected}
              compact
              showIsSmallerThanMin
              symbol="BGT"
            />
            <span className="text-xs text-muted-foreground">
              <FormattedNumber
                value={estimatedAmountDirected * parseFloat(price ?? "0")}
                showIsSmallerThanMin
                symbol="USD"
              />
            </span>
          </div>
        );
      },
      accessorKey: "yearlyBgt",
      enableSorting: false,
    },
  ];

  return gauge_validator_columns;
};

export const generalValidatorColumns: ColumnDef<ApiValidatorFragment>[] = [
  VALIDATOR_COLUMN,
  GLOBAL_VOTING_POWER_COLUMN,
  APY_COLUMN,
  MOST_WEIGHTED_GAUGE_COLUMN,
  BRIBES_COLUMN as ColumnDef<ApiValidatorFragment>,
];

export const user_general_validator_columns: ColumnDef<ValidatorWithUserBoost>[] =
  [
    VALIDATOR_COLUMN as ColumnDef<ValidatorWithUserBoost>,
    USER_BOOSTED_COLUMN,
    USER_QUEUED_BOOSTS_COLUMN,
    USER_QUEUED_DROP_BOOSTS_COLUMN,
    { ...APY_COLUMN, enableSorting: true } as ColumnDef<ValidatorWithUserBoost>,
    BRIBES_COLUMN,
  ];

export const user_incentives_columns: ColumnDef<ValidatorWithUserBoost>[] = [
  VALIDATOR_COLUMN as ColumnDef<ValidatorWithUserBoost>,
  USER_BOOSTED_COLUMN,
  APY_COLUMN as ColumnDef<ValidatorWithUserBoost>,
  CLAIMABLE_BRIBES_COLUMN,
];

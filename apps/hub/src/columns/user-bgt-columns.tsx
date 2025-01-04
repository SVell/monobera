import React, { useState } from "react";
import {
  type IContractWrite,
  usePollVaultsInfo,
  UserVault,
} from "@bera/berajs";
import { DataTableColumnHeader, FormattedNumber } from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import { Icons } from "@bera/ui/icons";
import { type ColumnDef } from "@tanstack/react-table";

import { GaugeHeaderWidget } from "~/components/gauge-header-widget";
import { ClaimBGTModal } from "~/app/vaults/components/claim-modal";
import { Address } from "viem";

export const getUserBgtColumns = ({
  isLoading,
  write,
}: {
  isLoading: boolean;
  write: (props: IContractWrite) => void;
}) => {
  const user_bgt_columns: ColumnDef<UserVault>[] = [
    {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reward Vault" />
      ),
      cell: ({ row }) => (
        <GaugeHeaderWidget
          address={row.original.vault.address as Address}
          className="w-[200px]"
          gauge={row.original.vault}
        />
      ),
      accessorKey: "gauge",
      enableSorting: false,
    },
    {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Amount Staked"
          className="items-center whitespace-nowrap text-center"
        />
      ),
      cell: ({ row }) => (
        <>
          <FormattedNumber
            value={row.original.balance}
            compact
            showIsSmallerThanMin
            className="text-md font-medium"
          />
          <span className="ml-1 text-xs text-muted-foreground">
            {row.original.vault?.metadata?.name}
          </span>
        </>
      ),
      accessorKey: "balance",
      enableSorting: true,
    },
    {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="BGT Rewards"
          className="items-center whitespace-nowrap text-center"
        />
      ),
      cell: ({ row }) => {
        const { data } = usePollVaultsInfo({
          vaultAddress: row.original.vault?.vaultAddress as Address,
        });

        return (
          <div className="flex w-fit items-center gap-1 rounded-full bg-success bg-opacity-10 px-2 py-1 text-sm font-medium text-success-foreground">
            <Icons.bgt className="h-6 w-6" />
            <FormattedNumber
              value={data?.rewards ?? row.original.unclaimedBgt}
              showIsSmallerThanMin
            />
          </div>
        );
      },
      accessorKey: "unclaimedBgt",
      enableSorting: true,
    },
    {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Incentives"
          className="w-20 items-center text-center"
        />
      ),
      cell: ({ row }) => {
        const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

        return (
          <>
            <ClaimBGTModal
              isOpen={isClaimModalOpen}
              onOpenChange={setIsClaimModalOpen}
              rewardVault={row.original.vault.vaultAddress as Address}
            />
            <Button
              size="sm"
              className="leading-5"
              variant="ghost"
              disabled={isLoading || row.original.unclaimedBgt === "0"}
              onClick={(e: any) => {
                e.stopPropagation();
                setIsClaimModalOpen(true);
              }}
            >
              Claim BGT
            </Button>
          </>
        );
      },
      accessorKey: "inflation",
      enableSorting: false,
    },
  ];
  return user_bgt_columns;
};

import React, { useMemo } from "react";
import {
  usePollGaugesData,
  useValidatorQueuedRewardAllocation,
  useBlockToTimestamp,
} from "@bera/berajs";
import { SimpleTable, useAsyncTable } from "@bera/shared-ui";
import { BeraChart } from "@bera/ui/bera-chart";
import { Card, CardContent } from "@bera/ui/card";
import { Skeleton } from "@bera/ui/skeleton";
import { type ColumnDef } from "@tanstack/react-table";
import { v4 as uuidv4 } from "uuid";
import { useBlockNumber } from "wagmi";
import { Address } from "viem";
type VaultData = {
  vaultAddress: string;
  stakingTokenAddress: string | undefined;
  symbol: string;
  name: string;
};

type VaultWeight = {
  address: string;
  distribution: number;
  id: string;
  name: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

export const QueuedRewardAllocationConfiguration = ({
  validatorPublicKey,
}: { validatorPublicKey: Address }) => {
  const {
    data: queuedRewardAllocation,
    isLoading: queuedRewardAllocationLoading,
  } = useValidatorQueuedRewardAllocation(validatorPublicKey);
  const { data, isLoading: allVaultsLoading } = usePollGaugesData();

  const vaultsData = useMemo<VaultData[] | undefined>(() => {
    return data?.vaults?.map((vault) => ({
      vaultAddress: vault.vaultAddress.toLowerCase(),
      stakingTokenAddress: vault.stakingToken?.address?.toLowerCase(),
      symbol: vault.stakingToken.symbol,
      name: vault.stakingToken.name,
    }));
  }, [data]);

  const { data: blockNumber } = useBlockNumber();

  const vaults = useMemo(() => {
    return queuedRewardAllocation?.weights.map((weight) => ({
      address: weight.receiver.toLowerCase(),
      distribution: Number(weight.percentageNumerator) / 100,
      id: uuidv4(),
      name: `${
        vaultsData?.find(
          (item) => item.vaultAddress === weight.receiver.toLowerCase(),
        )?.symbol
      } - ${
        vaultsData?.find(
          (item) => item.vaultAddress === weight.receiver.toLowerCase(),
        )?.name
      }`,
    }));
  }, [queuedRewardAllocation, vaultsData]);

  const startBlockTimestamp = useBlockToTimestamp(
    queuedRewardAllocation?.startBlock ?? 0,
  );

  const rgbColorPalette = [
    "rgb(248 113 113)", // bg-red-400
    "rgb(96 165 250)", // bg-blue-400
    "rgb(251 146 60)", // bg-orange-400
    "rgb(167 139 250)", // bg-violet-400
    "rgb(250 204 21)", // bg-yellow-400
    "rgb(74 222 128)", // bg-green-400
    "rgb(56 189 248)", // bg-sky-400
    "rgb(45 212 191)", // bg-teal-400
    "rgb(255 210 204)", // bg-pink-400,
    "rgb(156 163 175)", // bg-gray-400
  ];

  const queuedTableColumns = useMemo<
    ColumnDef<VaultWeight | undefined>[]
  >(() => {
    return [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="truncate text-xs">{row.original?.name}</div>
        ),
        enableSorting: false,
      },
      {
        header: "Vault Address",
        accessorKey: "address",
        cell: ({ row }) => (
          <div className="truncate text-xs">{row.original?.address}</div>
        ),
        enableSorting: false,
      },
      {
        header: "Distribution",
        accessorKey: "distribution",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-xs">{row.original?.distribution}%</div>
        ),
        minSize: 100,
        size: 100,
      },
    ];
  }, []);

  const queuedTable = useAsyncTable({
    fetchData: async () => {},
    columns: queuedTableColumns,
    data: vaults || [],
  });

  const pieChartData = useMemo(() => {
    if (!vaults || !vaultsData) return { labels: [], datasets: [] };
    return {
      labels: vaults?.map(
        (vault) =>
          vaultsData?.find((item) => item.vaultAddress === vault.address)
            ?.name || "Unassigned",
      ),
      datasets: [
        {
          data: vaults?.map((vault) => vault.distribution),
          hoverBorderWidth: 5,
          borderRadius: 8,
          spacing: 5,
          borderWidth: 0,
          backgroundColor: vaults?.map(
            (vault, index) => rgbColorPalette[index],
          ),
          hoverBorderColor: vaults?.map(
            (vault, index) => rgbColorPalette[index],
          ),
        },
      ],
    };
  }, [vaults]);

  const pieChartOptions = {
    responsive: true,
    cutout: "70%",
    radius: "95%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 1)",
        cornerRadius: 6,
        interaction: {
          intersect: true,
        },
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  return (
    <>
      {queuedRewardAllocationLoading || allVaultsLoading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : vaults && vaults.length > 0 ? (
        <Card className="">
          <CardContent className="grid grid-cols-1 gap-1 pt-6">
            <div className="flex w-full flex-col gap-4 xl:flex-row xl:gap-0">
              {/* Vaults Weight Chart */}
              <div className="flex w-[300px] flex-shrink-0 flex-col gap-4 self-center ">
                <div className="flex flex-col gap-4 self-center">
                  Queued Distribution
                </div>
                <div className="relative z-10 mx-auto h-[200px] w-[200px]">
                  <BeraChart
                    className="z-10"
                    data={pieChartData}
                    options={pieChartOptions}
                    type="doughnut"
                  />
                </div>
                <div className="mt-2 flex flex-col justify-center text-center">
                  <span>
                    {`${
                      Number(queuedRewardAllocation?.startBlock) -
                      Number(blockNumber)
                    }`}{" "}
                    Blocks Remaining
                  </span>
                  <span>
                    {startBlockTimestamp
                      ? dateFormatter.format(
                          typeof startBlockTimestamp === "number"
                            ? startBlockTimestamp * 1000
                            : startBlockTimestamp,
                        )
                      : "--"}
                  </span>
                </div>
              </div>
              <div className="flex w-full">
                <div className="flex w-full flex-grow flex-col gap-4">
                  <SimpleTable
                    wrapperClassName="w-full"
                    flexTable
                    dynamicFlex
                    variant="ghost"
                    mutedBackgroundOnHead={false}
                    showToolbar={false}
                    table={queuedTable}
                    lastRowBorder={false}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
};

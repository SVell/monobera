import { useMemo, useState } from "react";
import {
  ADDRESS_ZERO,
  useBgtInflation,
  useIsWhitelistedVault,
  useRewardVaultsFromTokens,
} from "@bera/berajs";
import { MinimalPoolInListFragment } from "@bera/graphql/dex/api";
import {
  DataTableColumnHeader,
  FormattedNumber,
  useAsyncTable,
} from "@bera/shared-ui";

import { PoolSummary } from "../../components/pools-table-columns";
import { usePools } from "./usePools";

export const usePoolTable = ({
  sorting,
  userPoolsOnly,
}: {
  sorting: any;
  page: number;
  pageSize: number;
  textSearch?: string;
  userPoolsOnly?: boolean;
}) => {
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");

  const handleEnter: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      setKeyword(search);
    }
  };

  const {
    pools: allPools,
    isPoolsLoading,
    walletPools,
  } = usePools({ keyword });

  const pools = userPoolsOnly ? walletPools : allPools;

  // Fetch reward vault addresses from token addresses
  const tokenAddresses = useMemo(
    () => pools?.map((pool) => pool.address) || [],
    [pools],
  );

  // Extract vault addresses from the token addresse and fetch the whitelist statuses for all of those vaults
  const { data: rewardVaults } = useRewardVaultsFromTokens({
    tokenAddresses,
  });

  const vaultAddresses = useMemo(
    () => Object.values(rewardVaults ?? {}).filter((v) => v !== ADDRESS_ZERO),
    [rewardVaults],
  );

  const { data: whitelistedVaults } = useIsWhitelistedVault(vaultAddresses);

  // Map vault whitelist status
  const whitelistStatusMap = useMemo(() => {
    return new Map(
      whitelistedVaults?.map((vault) => [vault.address, vault.isWhitelisted]) ||
        [],
    );
  }, [whitelistedVaults]);

  const table = useAsyncTable<MinimalPoolInListFragment>({
    data: pools ?? [],
    fetchData: async () => {},
    additionalTableProps: {
      initialState: { sorting, pagination: { pageSize: 10, pageIndex: 0 } },
      manualPagination: false,
      manualSorting: false,
    },
    enablePagination: true,
    enableRowSelection: false,
    columns: [
      {
        accessorKey: "address",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            className="flex items-center gap-1"
            title={"Pool Composition"}
          />
        ),
        cell: ({ row }) => {
          const rewardVault =
            rewardVaults?.[row.original.address.toLowerCase()];
          const isWhitelistedVault = rewardVault
            ? whitelistedVaults?.some(
                (vault) =>
                  vault.address.toLowerCase() === rewardVault.toLowerCase() &&
                  vault.isWhitelisted,
              ) ?? false
            : false;

          return (
            <div className="flex items-center gap-2">
              <PoolSummary
                pool={row.original}
                isWhitelistedVault={isWhitelistedVault}
              />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        minSize: 320,
      },
      {
        accessorKey: "totalLiquidity",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="TVL"
            className="min-w-[95px]"
          />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <div className="text-sm leading-5">
              <FormattedNumber
                value={row.original?.dynamicData?.totalLiquidity ?? 0}
                symbol="USD"
              />
            </div>
          </div>
        ),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
        sortingFn: (rowA, rowB) => {
          return (
            Number(rowA.original.dynamicData.totalLiquidity ?? "0") -
            Number(rowB.original.dynamicData.totalLiquidity ?? "0")
          );
        },
      },
      {
        accessorKey: "dynamicData__fees24h",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Fees (24h)"
            className="whitespace-nowrap"
          />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <div className="text-sm leading-5">
              <FormattedNumber
                value={row.original.dynamicData.fees24h ?? "0"}
                symbol="USD"
              />
            </div>
          </div>
        ),
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
        sortingFn: (rowA, rowB) => {
          return (
            Number(rowA.original.dynamicData.fees24h ?? "0") -
            Number(rowB.original.dynamicData.fees24h ?? "0")
          );
        },
      },
      {
        accessorKey: "dynamicData__volume24h",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Volume (24h)"
            className="whitespace-nowrap"
          />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <div className="text-sm leading-5">
              <FormattedNumber
                value={row.original.dynamicData.volume24h ?? "0"}
                symbol="USD"
              />
            </div>
          </div>
        ),
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
        sortingFn: (rowA, rowB) => {
          return (
            Number(rowA.original.dynamicData.volume24h ?? "0") -
            Number(rowB.original.dynamicData.volume24h ?? "0")
          );
        },
      },
      {
        accessorKey: "dynamicData__aprItems__0__apr",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="APR"
            className="whitespace-nowrap"
          />
        ),
        cell: ({ row }) => {
          return (
            <div
              className={`flex items-center justify-start text-sm ${
                row.original.dynamicData.aprItems?.at(0)?.apr === 0
                  ? "text-info-foreground"
                  : "text-warning-foreground"
              }`}
            >
              <FormattedNumber
                value={
                  row.original.dynamicData.aprItems?.at(0)?.apr?.toString() ??
                  "0"
                }
                percent
                compact
                showIsSmallerThanMin
              />
            </div>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
        sortingFn: (rowA, rowB) => {
          return (
            Number(rowA.original.dynamicData.aprItems?.at(0)?.apr ?? "0") -
            Number(rowB.original.dynamicData.aprItems?.at(0)?.apr ?? "0")
          );
        },
      },
    ],
  });

  return {
    data: pools,
    table,
    search,
    setSearch,
    isLoading: isPoolsLoading,
    handleEnter,
    keyword,
    setKeyword,
  };
};

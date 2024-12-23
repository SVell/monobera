"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useRewardVaults } from "@bera/berajs";
import {
  SimpleTable,
  getRewardsVaultUrl,
  useAsyncTable,
} from "@bera/shared-ui";
import type {
  PaginationState,
  SortingState,
  TableState,
  Updater,
} from "@tanstack/react-table";

import { AllRewardVaultColumns } from "~/columns/global-gauge-weight-columns";
import {
  GqlRewardVaultOrderBy,
  GqlRewardVaultOrderDirection,
} from "@bera/graphql/pol/api";

const GAUGE_PAGE_SIZE = 10;

const map: Record<string, GqlRewardVaultOrderBy> = {
  allTimeBGTReceived: GqlRewardVaultOrderBy.AllTimeBgtReceived,
  dynamicData_bgtCapturePercentage: GqlRewardVaultOrderBy.BgtCapturePercentage,
};
export default function GlobalGaugeWeightTable({
  myGauge = false,
  keywords = "",
  markets = [],
  isTyping = false,
}: {
  myGauge?: boolean;
  keywords?: string;
  markets?: string[];
  isTyping?: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isValidating } = useRewardVaults(
    {
      orderBy: map[sorting[0]?.id],
      orderDirection: (sorting[0]?.desc
        ? "desc"
        : "asc") as GqlRewardVaultOrderDirection,
      skip: GAUGE_PAGE_SIZE * page,
      // filterByProduct: markets,
      pageSize: GAUGE_PAGE_SIZE,
      search: isTyping ? "" : keywords,
    },
    { opts: { keepPreviousData: true } },
  );

  const gaugeList = data?.gaugeList ?? [];
  const gaugeCounts = data?.gaugeCounts ?? 0;

  const fetchData = useCallback(
    (state: TableState) => {
      setPage(state?.pagination?.pageIndex);

      setSorting(
        state?.sorting.map((s) => ({
          id: s.id,
          desc: s.desc,
        })),
      );
    },
    [setPage],
  );

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      setSorting((prev: SortingState) => {
        return typeof updater === "function" ? updater(prev ?? []) : updater;
      });
    },
    [setSorting],
  );

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      setPage((prev: number) => {
        const newPaginationState =
          typeof updater === "function"
            ? updater({
                pageIndex: prev ?? 0,
                pageSize: GAUGE_PAGE_SIZE,
              })
            : updater;
        return newPaginationState.pageIndex ?? 0;
      });
    },
    [setPage],
  );

  const allGaugeTable = useAsyncTable({
    fetchData: fetchData,
    columns: AllRewardVaultColumns,
    data: myGauge ? [] : gaugeList ?? [],
    enablePagination: true,
    additionalTableProps: {
      meta: {
        loading: isLoading,
        loadingText: "Loading...",
        validating: isValidating,
      },
      state: {
        pagination: {
          pageIndex: page,
          pageSize: GAUGE_PAGE_SIZE,
        },
        sorting,
      },
      manualSorting: true,
      manualPagination: true,
      autoResetPageIndex: false,
      pageCount: Math.ceil(gaugeCounts / GAUGE_PAGE_SIZE),
      onPaginationChange: handlePaginationChange,
      onSortingChange: handleSortingChange,
    },
  });

  return (
    <SimpleTable
      table={allGaugeTable}
      className="min-h-[200px] w-full min-w-[800px] shadow"
      wrapperClassName="min-h-[200px] w-full min-w-[800px]"
      variant="ghost"
      mutedBackgroundOnHead={false}
      flexTable
      onRowClick={(row: any) =>
        router.push(getRewardsVaultUrl(row.original.vaultAddress, myGauge))
      }
    />
  );
}

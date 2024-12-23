import React, { useCallback, useMemo, useState } from "react";
import {
  useAllValidators,
  useUserActiveValidators,
  type UserValidator,
} from "@bera/berajs";
import { SimpleTable, useAsyncTable } from "@bera/shared-ui";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
  TableState,
  Updater,
} from "@tanstack/react-table";

import { generalValidatorColumns } from "~/columns/general-validator-columns";
import {
  GqlValidatorOrderBy,
  GqlValidatorOrderDirection,
} from "@bera/graphql/pol/api";

const VALIDATOR_PAGE_SIZE = 10;

const map: Record<string, GqlValidatorOrderBy> = {
  dynamicData_bgtCapturePercentage: GqlValidatorOrderBy.BgtCapturePercentage,
  dynamicData_amountDelegated: GqlValidatorOrderBy.AmountDelegated,
  dynamicData_amountQueued: GqlValidatorOrderBy.AmountQueued,
};

export const AllValidator = ({
  keyword,
  isTyping,
  onRowClick,
  onRowHover,
  page,
  setPage,
}: {
  keyword?: any;
  isTyping?: boolean;
  onRowClick?: any;
  onRowHover?: any;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [sorting, setSorting] = useState<SortingState>();

  const {
    data: validatorData,
    isLoading,
    isValidating,
  } = useAllValidators({
    sortBy: map[sorting?.[0]?.id as string],
    sortOrder: sorting?.[0]
      ? sorting?.[0]?.desc
        ? GqlValidatorOrderDirection.Desc
        : GqlValidatorOrderDirection.Asc
      : GqlValidatorOrderDirection.Desc,
    search: isTyping ? "" : keyword,
  });

  const validators = validatorData?.validators?.validators ?? [];

  const fetchData = useCallback(
    (state: TableState) => {
      setPage(state?.pagination?.pageIndex);

      setSorting(state?.sorting);
    },
    [setPage],
  );

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      setPage((prev: number) => {
        const newPaginationState =
          typeof updater === "function"
            ? updater({
                pageIndex: prev ?? 0,
                pageSize: VALIDATOR_PAGE_SIZE,
              })
            : updater;
        return newPaginationState.pageIndex ?? 0;
      });
    },
    [setPage],
  );

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      setSorting((prev) => {
        const newPaginationState =
          typeof updater === "function" ? updater(prev ?? []) : updater;
        return newPaginationState.slice(0, 1);
      });
    },
    [setPage],
  );

  const allValidatorTable = useAsyncTable({
    fetchData: fetchData,
    columns: generalValidatorColumns,
    data:
      validators.slice(
        page * VALIDATOR_PAGE_SIZE,
        (page + 1) * VALIDATOR_PAGE_SIZE,
      ) ?? [],
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
          pageSize: VALIDATOR_PAGE_SIZE,
        },
        sorting,
      },
      autoResetPageIndex: false,
      pageCount: Math.ceil(validators.length / VALIDATOR_PAGE_SIZE),
      onPaginationChange: handlePaginationChange,
      onSortingChange: handleSortingChange,
    },
  });

  return (
    <SimpleTable
      table={allValidatorTable}
      className="min-h-[614px]"
      flexTable
      wrapperClassName="min-h-[614px]"
      variant="ghost"
      onRowClick={onRowClick}
      onRowHover={onRowHover}
      mutedBackgroundOnHead={false}
    />
  );
};

import { useMemo } from "react";
import { useUserActiveValidators, type UserValidator } from "@bera/berajs";
import { SimpleTable, useAsyncTable } from "@bera/shared-ui";
import type { ColumnDef } from "@tanstack/react-table";

import { user_general_validator_columns } from "~/columns/general-validator-columns";
import { ValidatorWithUserBoost } from "@bera/berajs/actions";

export const MyValidator = ({
  keyword,
  onRowClick,
}: {
  keyword?: any;
  onRowClick: any;
}) => {
  const { data = [], isLoading, isValidating } = useUserActiveValidators();
  const validators = useMemo(() => {
    return data.filter((validator) => {
      if (
        parseFloat(validator.userBoosts.activeBoosts) !== 0 ||
        parseFloat(validator.userBoosts.queuedBoosts) !== 0
      ) {
        if (keyword === "") return true;
        if (validator.pubkey.includes(keyword)) return true;
        if (validator.metadata?.name.includes(keyword)) return true;
      } else {
        return false;
      }
    });
  }, [data, keyword]);

  const allValidatorTable = useAsyncTable({
    fetchData: () => {},
    columns: user_general_validator_columns,
    data: validators ?? [],
    enablePagination: false,
    additionalTableProps: {
      meta: {
        loading: isLoading,
        loadingText: "Loading...",
        validating: isValidating,
      },
    },
  });

  return (
    <SimpleTable
      table={allValidatorTable}
      flexTable
      variant="ghost"
      showToolbar={false}
      onRowClick={onRowClick}
      mutedBackgroundOnHead={false}
    />
  );
};

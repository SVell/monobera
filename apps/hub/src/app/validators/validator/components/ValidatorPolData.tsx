import { SimpleTable, useAsyncTable } from "@bera/shared-ui";

import GlobalGaugeWeightChart from "~/components/global-gauge-weight-chart";
import { getValidatorGaugeColumns } from "~/columns/validator-gauge-columns";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";

export const ValidatorPolData = ({
  validator,
}: { validator: ApiValidatorFragment }) => {
  const gaugesTable = useAsyncTable({
    fetchData: async () => {},
    columns: getValidatorGaugeColumns(),
    data: validator.rewardAllocationWeights ?? [],
    additionalTableProps: {
      manualSorting: false,
      meta: {
        loadingText: "Loading...",
      },
    },
  });

  return (
    <div className="mt-6 flex w-full flex-col gap-6 lg:flex-row">
      <div className="w-full">
        <SimpleTable
          table={gaugesTable}
          // variant="ghost"
          wrapperClassName={"w-full"}
          flexTable
          dynamicFlex
          showToolbar={false}
        />
      </div>
      <GlobalGaugeWeightChart
        gaugeWeights={validator?.rewardAllocationWeights}
        totalAmountStaked={validator?.dynamicData?.amountDelegated ?? "0"}
        globalAmountStaked={"10000000"}
        isLoading={false}
        showTotal={false}
      />
    </div>
  );
};

import { BeraConfig } from "~/types";
import { getRewardVaults } from "./getRewardVaults";
import {
  ApiRewardAllocationWeightFragment,
  ApiVaultFragment,
  GqlRewardVaultOrderBy,
  GqlRewardVaultOrderDirection,
} from "@bera/graphql/pol/api";
import { ADDRESS_ZERO } from "~/config";

export const getGlobalCuttingBoard = async (
  threshold: number,
  config: BeraConfig,
): Promise<ApiRewardAllocationWeightFragment[]> => {
  const { gaugeList } = await getRewardVaults(config, {
    // TODO sort by bgt capture percentage
    orderBy: GqlRewardVaultOrderBy.Apy,
    orderDirection: GqlRewardVaultOrderDirection.Desc,
    pageSize: threshold,
    where: {
      includeNonWhitelisted: false,
    },
  });

  const weights = gaugeList.map(
    (gauge) =>
      ({
        receivingVault: gauge,
        percentageNumerator:
          Number(gauge.dynamicData?.bgtCapturePercentage) * 100,
        receiver: gauge.vaultAddress,
        validatorId: ADDRESS_ZERO,
        startBlock: 0,
      }) satisfies ApiRewardAllocationWeightFragment,
  );

  return weights;
};

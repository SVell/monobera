import { balancerApiChainName } from "@bera/config";
import { bexApiGraphqlClient } from "@bera/graphql";
import { GqlChain } from "@bera/graphql/dex/api";
import {
  ApiValidatorFragment,
  GlobalData,
  GlobalDataQuery,
  GlobalDataQueryVariables,
} from "@bera/graphql/pol/api";
import type { BeraConfig } from "~/types";

export interface GlobalInfo {
  bgtInfo: {
    bgtInflation: number;
    totalStakeBgt: number;
  };
  sumAllIncentivesInHoney: string;
  top3EmittingValidators: ApiValidatorFragment[];
  validatorCount: number;
  activeRewardVaultCount: number;
  whitelistedRewardVaultCount: number;
}

export const getBGTGlobalInfo = async (
  config: BeraConfig,
): Promise<GlobalInfo | undefined> => {
  const apiRes = await bexApiGraphqlClient.query<
    GlobalDataQuery,
    GlobalDataQueryVariables
  >({
    query: GlobalData,
    variables: {
      chain: balancerApiChainName as GqlChain,
    },
  });

  const data = apiRes.data;

  return {
    bgtInfo: {
      // TODO: get bgt inflation somehow, maybe from the backend
      bgtInflation: 0,
      totalStakeBgt: Number(data.polGetGlobalInfo?.totalBGTDelegated ?? "0"),
    },
    sumAllIncentivesInHoney:
      data.polGetGlobalInfo?.totalActiveIncentivesValueUSD ?? "0",
    validatorCount: data.polGetGlobalInfo?.totalValidators ?? 0,
    activeRewardVaultCount: data.polGetGlobalInfo?.totalActiveRewardVaults ?? 0,
    whitelistedRewardVaultCount:
      data.polGetGlobalInfo?.totalWhitelistedRewardVaults ?? 0,
    top3EmittingValidators: apiRes.data.top3EmittingValidators.validators,
  } satisfies GlobalInfo;
};

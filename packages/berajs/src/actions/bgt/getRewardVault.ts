import { balancerApiChainName } from "@bera/config";
import { bexApiGraphqlClient } from "@bera/graphql";
import {
  ApiVaultFragment,
  GetRewardVault,
  GetRewardVaultQuery,
  GetRewardVaultQueryVariables,
  GqlChain,
} from "@bera/graphql/pol/api";

export const getApiRewardVault = async (
  gaugeAddress: string,
): Promise<ApiVaultFragment> => {
  const { data } = await bexApiGraphqlClient.query<
    GetRewardVaultQuery,
    GetRewardVaultQueryVariables
  >({
    query: GetRewardVault,
    variables: {
      vaultId: gaugeAddress,
      chain: balancerApiChainName as GqlChain,
    },
  });

  if (!data?.rewardVault) {
    throw new Error("Reward vault not found");
  }

  return data.rewardVault;
};

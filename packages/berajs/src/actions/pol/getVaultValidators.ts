import { bexApiGraphqlClient, bgtClient } from "@bera/graphql";
import {
  ApiValidatorFragment,
  GetVaultValidators,
  GetVaultValidatorsQuery,
  GetVaultValidatorsQueryVariables,
} from "@bera/graphql/pol/api";

import { isAddress, type Address } from "viem";

import { BeraConfig } from "~/types";

export const getVaultValidators = async ({
  config,
  address,
}: {
  config?: BeraConfig;
  address: Address;
}): Promise<ApiValidatorFragment[]> => {
  const result = await bexApiGraphqlClient.query<
    GetVaultValidatorsQuery,
    GetVaultValidatorsQueryVariables
  >({
    query: GetVaultValidators,
    variables: { vaultId: address },
  });

  return result.data?.validators.validators ?? [];
};

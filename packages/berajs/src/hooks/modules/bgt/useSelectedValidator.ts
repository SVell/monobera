import { bexApiGraphqlClient } from "@bera/graphql";
import {
  ApiValidatorFragment,
  GetValidators,
  GetValidatorsQuery,
  GetValidatorsQueryVariables,
} from "@bera/graphql/pol/api";
import useSWR, { mutate } from "swr";
import { Address } from "viem";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export interface UsePollValidatorInfoResponse
  extends DefaultHookReturnType<ApiValidatorFragment> {}

export const useSelectedValidator = (
  id: Address,
  options?: DefaultHookOptions,
): UsePollValidatorInfoResponse => {
  const QUERY_KEY = id ? ["useSelectedValidator", id] : null;
  const swrResponse = useSWR<
    ApiValidatorFragment | undefined,
    any,
    typeof QUERY_KEY
  >(
    QUERY_KEY,
    async () => {
      const results = await bexApiGraphqlClient.query<
        GetValidatorsQuery,
        GetValidatorsQueryVariables
      >({
        query: GetValidators,
        variables: {
          where: {
            idIn: [id],
          },
        },
      });

      return results.data?.validators?.validators?.[0];
    },
    {
      ...options?.opts,
    },
  );

  return {
    ...swrResponse,
    refresh: () => mutate(QUERY_KEY),
  };
};

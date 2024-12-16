import { type GetValidatorByOperatorQuery } from "@bera/graphql/pol";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { Address } from "viem";

import { getValidatorByOperator } from "~/actions/pol";
import { useBeraJs } from "~/contexts";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export const useValidatorByOperator = (
  address: Address,
  options?: DefaultHookOptions,
): DefaultHookReturnType<GetValidatorByOperatorQuery | undefined> => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY =
    address && config ? ["useValidatorByOperator", address] : null;

  const swrResponse = useSWRImmutable<GetValidatorByOperatorQuery | undefined>(
    QUERY_KEY,
    async () => {
      return await getValidatorByOperator({ config, address: address });
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

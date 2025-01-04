import useSWR, { mutate } from "swr";
import { Address } from "viem";
import { getVaultValidators } from "~/actions";
import { DefaultHookOptions, DefaultHookReturnType, Validator } from "~/types";

export interface UsePollValidatorInfoResponse
  extends DefaultHookReturnType<Validator[] | undefined> {}

export const useVaultValidators = (
  id: Address,
  options?: DefaultHookOptions,
): UsePollValidatorInfoResponse => {
  const QUERY_KEY = id ? ["useVaultValidators", id] : null;
  const swrResponse = useSWR<Validator[] | undefined, any, typeof QUERY_KEY>(
    QUERY_KEY,
    async () => {
      return await getVaultValidators({
        address: id as Address,
      });
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

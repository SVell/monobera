import { ApiVaultFragment } from "@bera/graphql/pol/api";
import useSWR, { mutate } from "swr";
import { Address } from "viem";

import { getApiRewardVault } from "~/actions";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export interface UsePollValidatorInfoResponse
  extends DefaultHookReturnType<ApiVaultFragment> {}

export const useRewardVault = (
  id: Address | undefined,
  options?: DefaultHookOptions,
): UsePollValidatorInfoResponse => {
  const QUERY_KEY = id ? ["useSelectedValidator", id] : null;
  const swrResponse = useSWR<ApiVaultFragment, any, typeof QUERY_KEY>(
    QUERY_KEY,
    async () => {
      if (!id) throw new Error("Invalid address");
      return await getApiRewardVault(id);
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

import { bgtStaker } from "@bera/config";
import useSWR from "swr";
import { formatUnits } from "viem";
import { usePublicClient } from "wagmi";

import { getUserVaultsReward } from "~/actions";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";

export const useClaimableFees = (): any => {
  const { account } = useBeraJs();
  const publicClient = usePublicClient();
  const QUERY_KEY =
    account && publicClient ? ["useClaimableFees", account] : null;
  const swrResponse = useSWR<string | undefined>(
    QUERY_KEY,
    async () => {
      if (!account) return undefined;
      const vaultReward = await getUserVaultsReward({
        account,
        vaultAddress: bgtStaker,
        publicClient,
      });
      return formatUnits(vaultReward, 18);
    },
    {
      refreshInterval: POLLING.SLOW * 2,
    },
  );
  return {
    ...swrResponse,
    refresh: () => swrResponse?.mutate?.(),
  };
};

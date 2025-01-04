import useSWR from "swr";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { governanceTimelockAbi } from "~/abi";

import { getCancellerRole } from "~/actions/governance/getCancellerRole";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";

export const useIsCanceller = ({
  account,
}: { account: Address | undefined }) => {
  const { config } = useBeraJs();
  // TODO: get the timelock address from the config. We're assuming it's the same for all topics
  const timelockAddress = config?.contracts?.governance?.timelock;
  const client = usePublicClient();

  const QUERY_KEY =
    account && client && timelockAddress
      ? ["useCancellerRole", timelockAddress, account]
      : null;

  return useSWR(
    QUERY_KEY,
    async () => {
      const role = await getCancellerRole({
        client: client!,
        timelockAddress: timelockAddress!,
      });

      const canceller = await client!.readContract({
        abi: governanceTimelockAbi,
        address: timelockAddress!,
        functionName: "hasRole",
        args: [role, account!],
      });

      return canceller;
    },
    {
      refreshInterval: POLLING.SLOW,
      revalidateOnFocus: false,
    },
  );
};

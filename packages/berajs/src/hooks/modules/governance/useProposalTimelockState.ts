import useSWR, { SWRResponse } from "swr";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

import POLLING from "~/enum/polling";
import { governanceTimelockAbi } from "../../../abi";

const TimelockOperationState = {
  0: "unset",
  1: "waiting",
  2: "ready",
  3: "done",
} as const;

/**
 * Fetches the state of a proposal timelock
 * @returns state of the proposal timelock (unset, waiting, ready, done)
 */
export const useProposalTimelockState = ({
  proposalTimelockId,
  timelockAddress,
}: {
  proposalTimelockId: Address | undefined;
  timelockAddress: Address;
}): SWRResponse<
  (typeof TimelockOperationState)[keyof typeof TimelockOperationState]
> => {
  const publicClient = usePublicClient();

  const QUERY_KEY =
    timelockAddress && publicClient && proposalTimelockId
      ? ["useProposalTimelockState", proposalTimelockId]
      : null;

  return useSWR(
    QUERY_KEY,
    async () => {
      if (!publicClient) {
        throw new Error("public client is not defined");
      }

      const snapshot = (await publicClient.readContract({
        abi: governanceTimelockAbi,
        address: timelockAddress,
        functionName: "getOperationState",
        args: [proposalTimelockId!],
      })) as keyof typeof TimelockOperationState;

      return TimelockOperationState[snapshot];
    },
    {
      refreshInterval: POLLING.SLOW,
    },
  );
};

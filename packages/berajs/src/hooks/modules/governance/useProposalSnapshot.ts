import { governorAddress } from "@bera/config";
import { SWRResponse } from "swr";
import useSWRImmutable from "swr/immutable";
import { usePublicClient } from "wagmi";

import { GOVERNANCE_ABI } from "~/abi";

/**
 * Timepoint used to retrieve user’s votes and quorum. If using block
 * number (as per Compound’s Comp), the snapshot is performed at
 * the end of this block. Hence, voting for this proposal starts at the beginning of the following block.
 *
 * {@link https://docs.openzeppelin.com/contracts/5.x/api/governance#IGovernor-proposalSnapshot-uint256-}
 */
export const useProposalSnapshot = ({
  proposalId,
}: {
  proposalId: number | bigint | string | undefined;
}): SWRResponse<string> => {
  const publicClient = usePublicClient();

  const QUERY_KEY =
    publicClient && proposalId ? ["useProposalSnapshot", proposalId] : null;

  return useSWRImmutable(QUERY_KEY, async () => {
    if (!publicClient) {
      throw new Error("public client is not defined");
    }

    const snapshot = await publicClient.readContract({
      abi: GOVERNANCE_ABI,
      address: governorAddress,
      functionName: "proposalSnapshot",
      args: [BigInt(proposalId!)],
    });

    return snapshot.toString();
  });
};

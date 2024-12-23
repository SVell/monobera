import { useEffect } from "react";
import { FALLBACK_BLOCK_TIME } from "@bera/config";
import {
  ProposalStatus,
  ProposalWithVotesFragment,
} from "@bera/graphql/governance";
import useSWR from "swr";
import { useBlockNumber, usePublicClient } from "wagmi";

import { getProposalDetails } from "~/actions/governance/getProposalDetails";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";
import { DefaultHookOptions, DefaultHookReturnType } from "~/types";

export interface UsePollProposalResponse
  extends DefaultHookReturnType<ProposalWithVotesFragment> {}

/**
 * Polls a proposal and returns the proposal details.
 * Pulls data from the subgraph and onchain.
 *
 * @param proposalId - The ID of the proposal to poll
 * @param options - Optional configuration options
 * @param options.autoRefresh - If true, the data will be refreshed automatically based on the block number and status threshold
 * @returns {UsePollProposalResponse} Object containing:
 *   - data: ProposalWithVotesFragment | undefined - The proposal data if successful
 *   - error: Error | undefined - Error object if request failed
 *   - isLoading: boolean - True while data is being fetched
 *   - isValidating: boolean - True while data is being revalidated
 *   - mutate: () => Promise<ProposalWithVotesFragment | undefined> - Function to manually refresh the data
 *   - refresh: () => Promise<void> - Function to manually refresh the data
 */
export const usePollProposal = (
  proposalId: string,
  options?: DefaultHookOptions & { autoRefresh?: boolean },
): UsePollProposalResponse => {
  const { config: beraConfig } = useBeraJs();
  const autoRefreshProposal = options?.autoRefresh ?? false;
  const publicClient = usePublicClient();
  const { data: currentBlockNumber } = useBlockNumber({
    watch: {
      pollingInterval: FALLBACK_BLOCK_TIME,
      enabled: autoRefreshProposal,
    },
  });
  const config = options?.beraConfigOverride ?? beraConfig;
  const QUERY_KEY = proposalId ? ["usePollProposal", proposalId] : null;

  const swrResponse = useSWR<ProposalWithVotesFragment>(
    QUERY_KEY,
    async () =>
      await getProposalDetails({ proposalId, config, client: publicClient }),
    {
      ...options?.opts,
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.SLOW,
    },
  );

  useEffect(() => {
    if (swrResponse.data === undefined || !currentBlockNumber) return;

    switch (swrResponse.data.status) {
      case ProposalStatus.Pending:
        if (currentBlockNumber >= BigInt(swrResponse.data.voteStartBlock)) {
          swrResponse.mutate();
        }
        break;
      case ProposalStatus.Active:
        if (currentBlockNumber >= BigInt(swrResponse.data.voteEndBlock)) {
          swrResponse.mutate();
        }
        break;
      case ProposalStatus.InQueue:
        if (Date.now() / 1000 + 1 >= swrResponse.data.queueEnd) {
          swrResponse.mutate();
        }
        break;
    }
  }, [swrResponse.data?.status, currentBlockNumber]);

  // const votes = swrResponse.data?.votes.nodes ?? [];
  return {
    ...swrResponse,
    refresh: () => swrResponse?.mutate?.(),
  };
};

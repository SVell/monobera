import { useEffect, useMemo } from "react";
import {
  OrderDirection,
  ProposalStatus,
  Proposal_Filter,
  Proposal_OrderBy,
  ProposalSelectionFragment,
} from "@bera/graphql/governance";
import useSwrInfinite, { SWRInfiniteResponse } from "swr/infinite";

import { getAllProposals } from "~/actions/governance";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";
import { DefaultHookOptions } from "~/types";
import { FALLBACK_BLOCK_TIME } from "@bera/config";
import { useBlockNumber } from "wagmi";

const DEFAULT_PER_PAGE = 20;

const fromUiStatusToSubgraphStatuses = (
  status: ProposalStatus,
): ProposalStatus[] => {
  switch (status) {
    case ProposalStatus.QuorumNotReached:
      return [ProposalStatus.Active, ProposalStatus.Pending];
    case ProposalStatus.PendingQueue:
    case ProposalStatus.Defeated:
      return [ProposalStatus.Active];
    case ProposalStatus.PendingExecution:
      return [ProposalStatus.InQueue];
    default:
      return [status];
  }
};

type UsePollAllProposalsArgs = {
  topic: string;
  where?: Proposal_Filter;
  perPage?: number;
  orderBy?: Proposal_OrderBy;
  orderDirection?: OrderDirection;
  status_in?: ProposalStatus[];
  text?: string;
  autoRefreshProposals?: boolean;
};

type ProposalResult = {
  data: ProposalSelectionFragment[][];
  hasMore: boolean;
} & Omit<SWRInfiniteResponse<ProposalSelectionFragment[]>, "data">;

/**
 * Get all proposals for a given topic
 * @param args - The arguments to pass to the query
 * @param options - Optional configuration options
 * @param options.autoRefresh - If true, the data will be refreshed automatically based on the block number and status threshold
 * @returns {ProposalResult} Object containing:
 * - data: ProposalSelectionFragment[][] - The proposal data if successful
 * - error: Error | undefined - Error object if request failed
 * - isLoading: boolean - True while data is being fetched
 * - isValidating: boolean - True while data is being revalidated
 * - mutate: () => Promise<ProposalSelectionFragment[] | undefined> - Function to manually refresh the data
 * - refresh: () => Promise<void> - Function to manually refresh the data
 * - size: number - The number of proposals fetched
 * - setSize: (size: number) => void - Function to set the number of proposals fetched
 * - hasMore: boolean - True if there are more proposals to fetch
 */
export const usePollAllProposals = (
  args: UsePollAllProposalsArgs,
  options?: DefaultHookOptions & { autoRefresh?: boolean },
): ProposalResult => {
  const { config: beraConfig } = useBeraJs();
  const config = options?.beraConfigOverride ?? beraConfig;
  const autoRefreshProposals = options?.autoRefresh ?? false;
  const { data: currentBlockNumber } = useBlockNumber({
    watch: {
      pollingInterval: FALLBACK_BLOCK_TIME,
      enabled: autoRefreshProposals,
    },
  });

  const res = useSwrInfinite<ProposalSelectionFragment[]>(
    usePollAllProposalsQueryKey(args.topic, args),
    async ([key, page]: [string, number]) => {
      const statuses = args.status_in
        ?.flatMap((status) => fromUiStatusToSubgraphStatuses(status))
        .filter((s, i, arr) => arr.indexOf(s) === i);

      const proposals = await getAllProposals({
        where: {
          topics_contains: [args.topic],
          status_in: statuses?.length ? statuses : undefined,
          ...args.where,
        },
        orderBy: args.orderBy,
        orderDirection: args.orderDirection,
        config,
        text: args.text,
        offset: page * (args.perPage ?? DEFAULT_PER_PAGE),
      });

      if (!proposals) return [];

      // Filter out any undefined values
      return proposals.filter(
        (proposal): proposal is ProposalSelectionFragment =>
          proposal !== null && proposal !== undefined,
      );
    },
    {
      ...options?.opts,
      initialSize: 2,
      refreshInterval: options?.opts?.refreshInterval ?? POLLING.SLOW,
    },
  );

  const flattenedProposals = useMemo(() => res.data?.flat(), [res.data]);
  const statuses = flattenedProposals?.map((p) => p.status);

  useEffect(() => {
    if (flattenedProposals === undefined || !currentBlockNumber) return;

    let shouldMutate = false;

    for (const proposal of flattenedProposals) {
      switch (proposal.status) {
        case ProposalStatus.Pending:
          if (currentBlockNumber >= BigInt(proposal.voteStartBlock)) {
            shouldMutate = true;
          }
          break;
        case ProposalStatus.Active:
          if (currentBlockNumber >= BigInt(proposal.voteEndBlock)) {
            shouldMutate = true;
          }
          break;
        case ProposalStatus.InQueue: {
          if (Date.now() / 1000 + 1 >= proposal.queueEnd) {
            shouldMutate = true;
          }
        }
      }
    }

    if (shouldMutate) {
      res.mutate();
    }
  }, [statuses, currentBlockNumber]);

  const data = useMemo(() => {
    if (!res.data) return [];

    const filteredProposals = res.data
      .flat()
      .filter((proposal): proposal is ProposalSelectionFragment => {
        if (!proposal) return false;
        if (!args.status_in || args.status_in.length === 0) return true;
        return args.status_in.includes(proposal.status);
      })
      .sort((a, b) => {
        if (!args.text) return 0;

        let result = 0;
        if (args.orderBy === Proposal_OrderBy.CreatedAt) {
          result = Number(b.createdAt) - Number(a.createdAt);
        }
        return args.orderDirection === "asc" ? result : -result;
      });

    return filteredProposals.reduce<ProposalSelectionFragment[][]>(
      (acc, curr) => {
        const currSection = acc.at(-1);

        if (
          !currSection ||
          currSection.length === (args.perPage ?? DEFAULT_PER_PAGE)
        ) {
          return [...acc, [curr]];
        }

        currSection.push(curr);
        return acc;
      },
      [],
    );
  }, [res.data, args]);

  return {
    ...res,
    data,
    hasMore: data.at(-1)?.length === (args.perPage ?? DEFAULT_PER_PAGE),
  };
};

// Query key generator remains the same
export const usePollAllProposalsQueryKey =
  (topic: string, args: Partial<UsePollAllProposalsArgs> = {}) =>
  (page: number, previousPageData?: any): [string, number, ...any[]] | null => {
    if (!previousPageData && page !== 0) return null;

    return [
      "usePollAllProposals",
      page,
      topic,
      args.where,
      args.status_in
        ?.flatMap((status) => fromUiStatusToSubgraphStatuses(status))
        .filter((s, i, arr) => arr.indexOf(s) === i),
      args.orderBy,
      args.orderDirection,
      args.perPage,
      args.text,
    ];
  };

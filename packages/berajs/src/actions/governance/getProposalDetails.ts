import { FALLBACK_BLOCK_TIME } from "@bera/config";
import { governanceClient } from "@bera/graphql";
import {
  GetProposal,
  GetProposalDocument,
  ProposalWithVotesFragment,
} from "@bera/graphql/governance";
import { wagmiConfig } from "@bera/wagmi/config";
import { GetPublicClientReturnType, getBlockNumber } from "@wagmi/core";

import { GOVERNANCE_ABI } from "~/abi";
import { BeraConfig } from "~/types";
import { computeActualStatus } from "./computeActualStatus";

export const getProposalDetails = async ({
  proposalId,
  config,
  client,
}: {
  proposalId: string;
  config: BeraConfig;
  client?: GetPublicClientReturnType;
}): Promise<ProposalWithVotesFragment> => {
  if (!config.subgraphs?.governanceSubgraph) {
    throw new Error("governance subgraph uri is not found in config");
  }
  if (!config.contracts?.governance) {
    throw new Error("governance address is not found in config");
  }

  const [res, blocknumber, state] = await Promise.all([
    governanceClient.query({
      query: GetProposal,
      variables: {
        id: proposalId,
      },
    }),
    getBlockNumber(wagmiConfig, {
      cacheTime: FALLBACK_BLOCK_TIME * 1000,
    }),
    client?.readContract({
      address: config.contracts?.governance.governor,
      abi: GOVERNANCE_ABI,
      functionName: "state",
      args: [BigInt(proposalId)],
    }),
  ]);

  return {
    ...res.data.proposal,
    status: computeActualStatus(res.data.proposal, blocknumber, state),
  } as ProposalWithVotesFragment;
};

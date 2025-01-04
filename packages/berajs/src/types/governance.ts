import {
  ProposalVoteFragment,
  ProposalWithVotesFragment,
} from "@bera/graphql/governance";
import { Address } from "viem";

export type Proposal = ProposalWithVotesFragment;

export type Vote = ProposalVoteFragment;

export type Voter = Address;

export type ExecutableCalls = {
  calldata: string;
  offchaindata: any;
  signature: string;
  target: Address;
  type: any;
  value: string;
};

/**
 * Maps the proposal state from the governor contract to a more human-readable format.
 * Don't edit this enum manually, it's synced with the governor contract.
 *
 * @see https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/IGovernor.sol
 */
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

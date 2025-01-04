import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@bera/ui/badge";
import { formatTimeLeft, getBadgeColor, getTimeLeft } from "../helper";
import { useBlockToTimestamp, useProposalTimelockState } from "@bera/berajs";
import { cn } from "@bera/ui";
import {
  ProposalSelectionFragment,
  ProposalStatus,
} from "@bera/graphql/governance";
import { governanceTimelockAddress } from "@bera/config";

export const statusMap: Record<ProposalStatus, string> = {
  [ProposalStatus.Active]: "Active",
  [ProposalStatus.CanceledByGuardian]: "Canceled by guardian",
  [ProposalStatus.CanceledByUser]: "Canceled by user",
  [ProposalStatus.Defeated]: "Defeated",
  [ProposalStatus.Executed]: "Executed",
  // [ProposalStatus.Expired]: "Expired",
  [ProposalStatus.InQueue]: "In queue",
  [ProposalStatus.Pending]: "Pending",
  [ProposalStatus.PendingExecution]: "Pending execution",
  [ProposalStatus.PendingQueue]: "Pending queue",
  [ProposalStatus.QuorumNotReached]: "Quorum not reached",
  // [ProposalStatus.Succeeded]: "Succeeded",
};

export const StatusBadge = ({
  proposal,
  className,
}: { proposal: ProposalSelectionFragment; className?: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  const { data: timelockState } = useProposalTimelockState({
    proposalTimelockId: proposal.timelock?.id,
    timelockAddress: governanceTimelockAddress,
  });

  const startTimestamp = useBlockToTimestamp(
    proposal.status === ProposalStatus.Pending
      ? proposal.voteStartBlock
      : undefined,
  );
  const endTimestamp = useBlockToTimestamp(
    proposal.status === ProposalStatus.Active
      ? proposal.voteEndBlock
      : undefined,
  );

  useEffect(() => {
    const updateTime = () => {
      let timestamp;
      if (proposal.status === ProposalStatus.Pending) {
        timestamp = startTimestamp;
      } else if (proposal.status === ProposalStatus.Active) {
        timestamp = endTimestamp;
      } else if (proposal.status === ProposalStatus.InQueue) {
        timestamp = proposal.queueEnd;
      } else {
        timestamp = null;
      }

      if (timestamp) {
        const timeLeftMs = getTimeLeft(new Date(timestamp * 1000));
        if (timeLeftMs <= 0) {
          setTimeLeft("Less than a minute left");
        } else {
          setTimeLeft(`~ ${formatTimeLeft(timeLeftMs)} left`);
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 5000);

    return () => clearInterval(interval);
  }, [proposal.status, startTimestamp, endTimestamp]);

  const status =
    proposal.status === ProposalStatus.PendingExecution &&
    proposal.queueEnd === null &&
    proposal.queueStart === null &&
    timelockState !== "ready"
      ? ProposalStatus.InQueue
      : proposal.status;

  return (
    <div
      className={cn(
        "text-xs col-span-full font-medium leading-6 text-muted-foreground",
        className,
      )}
    >
      <Badge
        variant={getBadgeColor(status)}
        className="mr-3 select-none rounded-xs px-2 py-1 text-sm leading-none font-semibold capitalize"
      >
        {statusMap[status]}
      </Badge>
      {(proposal.status === ProposalStatus.Pending ||
        proposal.status === ProposalStatus.InQueue ||
        proposal.status === ProposalStatus.Active) &&
        timeLeft && <span className="whitespace-nowrap">{timeLeft}</span>}
    </div>
  );
};

export default StatusBadge;

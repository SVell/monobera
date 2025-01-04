import { useBlockToTimestamp, useProposalTimelockState } from "@bera/berajs";
import { cn } from "@bera/ui";
import {
  ProposalStatus,
  ProposalWithVotesFragment,
} from "@bera/graphql/governance";
import { governanceTimelockAddress } from "@bera/config";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

const Step = ({
  title,
  date,
  isActive,
  block,
  bulletClassName,
}: {
  title: string;
  date?: number | Date;
  isActive: boolean;
  block?: number | bigint | string;
  bulletClassName?: string;
}) => {
  const d = block ? useBlockToTimestamp(block) : date;

  return (
    <div className="flex gap-2 items-center pb-16 last:pb-6 group/step">
      <div>
        <div
          className={cn("h-4 w-4 rounded-full relative flex justify-center", {
            [bulletClassName ?? "bg-primary"]: isActive,
            "bg-primary-foreground": !isActive,
          })}
        >
          <div className="h-16 bg-primary-foreground w-[1px] absolute top-full group-last/step:hidden" />
        </div>
      </div>
      <div className="h-4">
        <h3 className="leading-none text-primary mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {d ? dateFormatter.format(d instanceof Date ? d : d * 1000) : "--"}
        </p>
      </div>
    </div>
  );
};
export const ProposalTimeline = ({
  proposal,
}: { proposal: ProposalWithVotesFragment }) => {
  const steps: ({
    title: string;
    isActive: boolean;
    bulletClassName?: string;
  } & (
    | {
        date: number | Date;
      }
    | {
        block: number | bigint | string;
      }
  ))[] = [
    {
      title: "Initiated",
      date: proposal.createdAt,
      block: proposal.createdAtBlock,
      isActive: proposal.status === ProposalStatus.Pending,
    },
  ];

  const { data: timelockState } = useProposalTimelockState({
    proposalTimelockId: proposal.timelock?.id,
    timelockAddress: governanceTimelockAddress,
  });

  const status =
    proposal.status === ProposalStatus.PendingExecution &&
    proposal.queueEnd === null &&
    proposal.queueStart === null &&
    timelockState !== "ready"
      ? ProposalStatus.InQueue
      : proposal.status;

  if (status === ProposalStatus.CanceledByUser) {
    steps.push({
      title: "Canceled by proposer",
      date: proposal.canceledAt,
      isActive: true,
      bulletClassName: "bg-destructive-foreground",
    });
  } else {
    steps.push({
      title: "Voting Period Begun",
      block: proposal.voteStartBlock ?? 0,
      isActive: status === ProposalStatus.Active,
    });

    if (status === ProposalStatus.Active) {
      steps.push({
        title: "Voting Period Ends",
        block: proposal.voteEndBlock,
        isActive: false,
      });
    } else if (
      status === ProposalStatus.Defeated ||
      status === ProposalStatus.QuorumNotReached
    ) {
      steps.push({
        title: "Proposal Defeated",
        bulletClassName: "bg-destructive-foreground",
        block: proposal.voteEndBlock,
        isActive: true,
      });
    } else if (status === ProposalStatus.Pending) {
      steps.push({
        title: "Voting Period Ends",
        block: proposal.voteEndBlock,
        isActive: false,
      });
    } else {
      if (proposal.succeededAt) {
        steps.push({
          title: "Proposal Queueable",
          date: proposal.succeededAt,
          isActive: status === ProposalStatus.PendingQueue,
        });
      } else {
        steps.push({
          title: "Voting Period Ends",
          block: proposal.voteEndBlock,
          bulletClassName: "bg-success-foreground",
          isActive: status === ProposalStatus.PendingQueue,
        });
      }

      if (status !== ProposalStatus.PendingQueue) {
        steps.push({
          title: "Proposal Queued",
          date: proposal.queueStart ?? new Date().getTime() / 1000,
          isActive: status === ProposalStatus.InQueue,
        });

        if (status === ProposalStatus.CanceledByGuardian) {
          steps.push({
            title: "Canceled by guardian",
            date: proposal.canceledAt,
            isActive: true,
            bulletClassName: "bg-destructive-foreground",
          });
        } else if (status === ProposalStatus.Executed) {
          steps.push({
            title: "Queue Ended",
            date: proposal.queueEnd,
            isActive: false,
          });
          steps.push({
            title: "Proposal Executed",
            date: proposal.executedAt,
            isActive: status === ProposalStatus.Executed,
            bulletClassName: "bg-success-foreground",
          });
        } else if (status === ProposalStatus.InQueue) {
          steps.push({
            title: "Queue Ending",
            // Temporary fix for proposals that are in queue but have no queueEnd
            date: proposal.queueEnd ?? new Date().getTime() / 1000 + 60 * 15,
            isActive: false,
          });
          steps.push({
            title: "Proposal Executable",
            date: proposal.queueEnd ?? new Date().getTime() / 1000 + 60 * 15,
            isActive: false,
          });
        } else if (status === ProposalStatus.PendingExecution) {
          steps.push({
            title: "Queue Ended",
            date: proposal.queueEnd,
            isActive: false,
          });
          steps.push({
            title: "Proposal Executable",
            date: proposal.queueEnd,
            isActive: true,
          });
        }
      }
    }
  }

  return (
    <div className="gap-4 p-5 rounded-sm border border-border relative   ">
      {steps.map((step) => (
        <Step key={step.title} {...step} />
      ))}
    </div>
  );
};

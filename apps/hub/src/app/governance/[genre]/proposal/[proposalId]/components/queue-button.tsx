import { use, useEffect, useRef, useState } from "react";
import { GOVERNANCE_ABI, Proposal, usePollProposal } from "@bera/berajs";
import { governanceTimelockAddress } from "@bera/config";
import { ActionButton, useTxn } from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@bera/ui/dialog";

import { useGovernance } from "~/app/governance/[genre]/components/governance-provider";
import { StatusBadge } from "~/app/governance/components/status-badge";

export const QueueButton = ({
  proposal,
  title,
}: {
  proposal: Proposal;
  title: string;
}) => {
  const { refresh } = usePollProposal(proposal.id);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { write, ModalPortal } = useTxn({
    message: "Queuing proposal",
    onSuccess: () => {
      setOpen(false);
      // Wait a few seconds for subgraph to update and then refresh
      timeoutRef.current = setTimeout(() => {
        refresh();
      }, 3000);
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const { governorAddress } = useGovernance();
  return (
    <>
      {ModalPortal}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button>Queue</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Queue Proposal</DialogTitle>
          <DialogDescription>
            <p className="mb-4">
              Queueing this proposal will send it into a 3 hour timelock that
              enables execution.
            </p>
            <div className="rounded-sm border border-border p-4">
              <h3 className="mb-3 line-clamp-1 hyphens-auto text-base font-semibold text-foreground">
                {title}
              </h3>
              <StatusBadge proposal={proposal} />
            </div>
          </DialogDescription>
          <DialogFooter>
            <ActionButton>
              <Button
                className="w-full"
                onClick={() =>
                  write({
                    address: governorAddress,
                    abi: GOVERNANCE_ABI,
                    functionName: "queue",
                    params: [BigInt(proposal.id)],
                  })
                }
              >
                Queue
              </Button>
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

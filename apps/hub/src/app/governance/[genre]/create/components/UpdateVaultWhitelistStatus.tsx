import { Dispatch, SetStateAction, useEffect } from "react";
import { cn } from "@bera/ui";
import { Address } from "viem";

import {
  CustomProposalActionErrors,
  ProposalAction,
  ProposalErrorCodes,
  ProposalTypeEnum,
} from "~/app/governance/types";
import { InputWithLabel } from "@bera/ui/input";
import { beraChefAddress } from "@bera/config";

export const UpdateVaultWhitelistStatus = ({
  action: gauge,
  setAction,
  errors,
}: {
  action: ProposalAction & {
    type:
      | ProposalTypeEnum.BLACKLIST_REWARD_VAULT
      | ProposalTypeEnum.WHITELIST_REWARD_VAULT;
  };
  setAction: Dispatch<SetStateAction<ProposalAction>>;
  errors: CustomProposalActionErrors;
}) => {
  const isWhitelisted = gauge.type === ProposalTypeEnum.WHITELIST_REWARD_VAULT;
  return (
    <>
      <div className="rounded-md border border-border p-3">
        <div className="flex gap-2 text-sm font-semibold">
          <span
            className={cn(
              !isWhitelisted
                ? "text-destructive-foreground"
                : "text-success-foreground",
            )}
          >
            {isWhitelisted
              ? "This vault will be able to receive BGT rewards."
              : "This vault will not be able to receive BGT rewards."}
          </span>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Update this reward vault to be {!isWhitelisted ? "in-" : ""}
          eligible to receive emissions.
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <InputWithLabel
          variant="black"
          label="Reward Vault Address"
          value={gauge?.vault}
          error={
            errors.vault === ProposalErrorCodes.REQUIRED
              ? "A Vault Must Be Chosen"
              : errors.vault === ProposalErrorCodes.INVALID_ADDRESS
                ? "Invalid Vault address."
                : errors.vault
          }
          onChange={async (e) => {
            setAction({
              ...gauge,
              target: beraChefAddress,
              vault: e.target.value as Address,
            });
          }}
        />
      </div>
    </>
  );
};

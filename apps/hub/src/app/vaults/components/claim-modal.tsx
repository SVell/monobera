import { useEffect, useState } from "react";
import {
  BERA_VAULT_REWARDS_ABI,
  TransactionActionType,
  truncateHash,
  useBeraJs,
  usePollVaultsInfo,
} from "@bera/berajs";
import { governanceTokenAddress } from "@bera/config";
import { FormattedNumber, TokenIcon, useTxn } from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bera/ui/dialog";
import { Icons } from "@bera/ui/icons";
import { Address, isAddress } from "viem";
import { Skeleton } from "@bera/ui/skeleton";
import { InputWithLabel } from "@bera/ui/input";
import { cn } from "@bera/ui";
import { useLocalStorage } from "usehooks-ts";
import { LOCAL_STORAGE_KEYS } from "~/utils/constants";

export const ClaimBGTModal = ({
  isOpen,
  onOpenChange,
  rewardVault,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  rewardVault: Address;
}) => {
  const { account } = useBeraJs();
  const [recipient, setRecipient] = useLocalStorage<string | undefined>(
    LOCAL_STORAGE_KEYS.CLAIM_REWARDS_RECIPIENT,
    account,
  );
  const [error, setError] = useState<string>();
  const [showInput, setShowInput] = useState(false);

  const { write, ModalPortal } = useTxn({
    message: "Claim BGT Rewards",
    actionType: TransactionActionType.CLAIMING_REWARDS,
    onSuccess: () => refresh(),
  });

  useEffect(() => {
    if (!account || showInput) {
      return;
    }

    if (recipient?.toLowerCase() !== account.toLowerCase()) {
      setShowInput(true);
    } else if (!showInput) {
      setRecipient(account as Address);
    }
  }, [account, showInput]);

  const { data, refresh } = usePollVaultsInfo({
    vaultAddress: rewardVault,
  });

  function checkAddress(recipient: string | undefined): recipient is Address {
    const error =
      !recipient || !isAddress(recipient) ? "Enter a valid address" : undefined;
    setError(error);
    return !error;
  }

  return (
    <>
      {ModalPortal}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim</DialogTitle>
            <DialogDescription className="grid grid-cols-1 gap-4">
              <p className="text-muted-foreground">
                Select a wallet to receive rewards
              </p>
              <div className="grid grid-cols-1  sm:grid-cols-2 mt-6 mb-6 gap-4 leading-tight text-foreground">
                <div className="">
                  <h3 className="text-muted-foreground text-left font-medium text-sm">
                    Available Rewards to claim
                  </h3>
                  <p className="flex w-auto items-center mt-1 gap-1">
                    {data?.rewards ? (
                      <FormattedNumber
                        className="text-primary font-medium"
                        value={Number(data?.rewards)}
                        symbol="BGT"
                      />
                    ) : (
                      <Skeleton className="h-3 w-12" />
                    )}
                    <TokenIcon size="md" address={governanceTokenAddress} />
                  </p>
                </div>
              </div>

              <h3 className="text-sm text-left font-semibold text-foreground">
                Claim to
              </h3>
              <div
                className={cn(
                  "flex cursor-pointer gap-2 rounded-sm p-4 hover:bg-muted ",
                  !showInput
                    ? "border-2 border-info-foreground"
                    : "border border-border",
                )}
                onClick={() => {
                  setShowInput(false);
                  setRecipient(account as Address);
                }}
              >
                <Icons.user className="h-4 w-4" />
                <div>
                  <div className="text-sm font-semibold leading-4 text-foreground">
                    Connected Wallet{" "}
                    <span className="text-muted-foreground">
                      ({truncateHash(account ?? "0x")})
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "flex cursor-pointer gap-2 rounded-sm p-4 hover:bg-muted ",
                  recipient === account
                    ? "border-border border "
                    : "border-info-foreground border-2",
                )}
                onClick={() => {
                  setShowInput(true);
                  setRecipient("" as Address);
                }}
              >
                <Icons.sendIcon className="h-4 w-4" />
                <div>
                  <div className="text-sm font-semibold leading-4 text-foreground">
                    Another Wallet
                  </div>
                </div>
              </div>

              {showInput ? (
                <div className="">
                  <InputWithLabel
                    variant="black"
                    className="w-full"
                    placeholder="Enter delegation address"
                    error={error}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
              ) : null}

              <Button
                className="mt-4"
                disabled={!recipient || !isAddress(recipient)}
                onClick={() =>
                  checkAddress(recipient) &&
                  write({
                    address: rewardVault,
                    abi: BERA_VAULT_REWARDS_ABI,
                    functionName: "getReward",
                    params: [account!, recipient], // TODO: A second param is needed here for recipient. Added current account twice for now
                  })
                }
              >
                Confirm
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

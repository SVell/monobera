import { BGT_ABI, TransactionActionType, useBeraJs } from "@bera/berajs";
import { HISTORY_BUFFER } from "../../components/boost-queue";
import { useBlockNumber } from "wagmi";
import { bgtTokenAddress } from "@bera/config";
import { FormattedNumber, useTxn } from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import { Address, parseEther } from "viem";
import { Icons } from "@bera/ui/icons";

export const QueueItem = ({
  amount,
  startBlock,
  onSuccess,
  valPubKey,
  isDropBoost,
}: {
  amount: string;
  startBlock: number;
  valPubKey: string;
  isDropBoost: boolean;
  onSuccess: () => void;
}) => {
  const { account } = useBeraJs();
  const {
    write: activateWrite,
    isLoading: isActivationLoading,
    ModalPortal: ActivateModalPortal,
  } = useTxn({
    message: "Activating queued BGT to Validator",
    actionType: TransactionActionType.DELEGATE,
    onSuccess,
  });

  const {
    write: dropBoostWrite,
    isLoading: isDropBoostLoading,
    ModalPortal: DropBoostModalPortal,
  } = useTxn({
    message: "Confirming queued boost drop to validator",
    actionType: TransactionActionType.DELEGATE,
    onSuccess,
  });

  const {
    write: cancelWrite,
    isLoading: isCancelLoading,
    ModalPortal: CancelModalPortal,
  } = useTxn({
    message: "Cancelling queued BGT to Validator",
    actionType: TransactionActionType.DELEGATE,
    onSuccess,
  });

  const {
    write: cancelDropBoostWrite,
    isLoading: isCancelDropBoostLoading,
    ModalPortal: CancelDropBoostModalPortal,
  } = useTxn({
    message: "Cancelling queued drop boost to Validator",
    actionType: TransactionActionType.DELEGATE,
    onSuccess,
  });

  const isTxnLoading =
    isActivationLoading ||
    isDropBoostLoading ||
    isCancelLoading ||
    isCancelDropBoostLoading;

  const { data: block } = useBlockNumber();

  const blocksLeft = Number(startBlock) + HISTORY_BUFFER - Number(block);

  const isReadyForConfirmation = blocksLeft <= 0;

  return (
    <div className="w-full ">
      {ActivateModalPortal}
      {DropBoostModalPortal}
      {CancelModalPortal}
      {CancelDropBoostModalPortal}
      <div className="flex w-full justify-between">
        <div className="font-medium">
          <div>
            <div className="flex items-center gap-2">
              <Icons.bgt className="h-6 w-6" />
              <FormattedNumber
                value={Number(amount) * (isDropBoost ? -1 : 1)}
                colored={isDropBoost}
                prefixText={isDropBoost ? "" : "+"}
                symbol="BGT"
              />
            </div>
            <div className="pl-8 text-sm text-muted-foreground">
              {!isReadyForConfirmation ? (
                <>
                  <span className="text-info-foreground">{blocksLeft} </span>
                  blocks remaining
                </>
              ) : (
                <span className="text-success-foreground">
                  Ready for confirmation
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            disabled={isTxnLoading || !isReadyForConfirmation}
            onClick={() =>
              isDropBoost
                ? dropBoostWrite({
                    address: bgtTokenAddress,
                    abi: BGT_ABI,
                    functionName: "dropBoost",
                    params: [account!, valPubKey as Address],
                  })
                : activateWrite({
                    address: bgtTokenAddress,
                    abi: BGT_ABI,
                    functionName: "activateBoost",
                    params: [account!, valPubKey as Address],
                  })
            }
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            disabled={isTxnLoading}
            onClick={() => {
              if (isDropBoost) {
                cancelDropBoostWrite({
                  address: bgtTokenAddress,
                  abi: BGT_ABI,
                  functionName: "cancelDropBoost",
                  params: [valPubKey as Address, parseEther(amount)],
                });
              } else {
                cancelWrite({
                  address: bgtTokenAddress,
                  abi: BGT_ABI,
                  functionName: "cancelBoost",
                  params: [valPubKey as Address, BigInt(amount)],
                });
              }
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

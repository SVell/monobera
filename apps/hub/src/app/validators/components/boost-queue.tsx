import { useMemo, useState } from "react";
import {
  BGT_ABI,
  IContractWrite,
  TransactionActionType,
  truncateHash,
  useBgtUnstakedBalance,
  useUserActiveValidators,
  useBeraJs,
  useAllValidators,
} from "@bera/berajs";
import { bgtTokenAddress } from "@bera/config";
import { FormattedNumber, ValidatorIcon, useTxn } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { Button } from "@bera/ui/button";
import { Skeleton } from "@bera/ui/skeleton";
import { Address, parseUnits } from "viem";
import { useBlockNumber } from "wagmi";
import { ValidatorWithUserBoost } from "@bera/berajs/actions";

export const HISTORY_BUFFER = 8192;

type QueueItem = ValidatorWithUserBoost & {
  canActivate: boolean;
  type: "boost" | "dropBoost";
};

export const BoostQueue = ({
  setIsValidatorDataLoading,
}: {
  isValidatorDataLoading?: boolean;
  setIsValidatorDataLoading: (loading: boolean) => void;
}) => {
  const { data = [], refresh } = useUserActiveValidators();
  const { refresh: refreshBalance } = useBgtUnstakedBalance();

  const { data: blockNumber } = useBlockNumber();

  const queuedList = useMemo(() => {
    return !data || !blockNumber || !data.length
      ? []
      : data.flatMap((validator) => {
          const items: QueueItem[] = [];

          if (Number(validator.userBoosts.queuedBoosts) > 0) {
            items.push({
              ...validator,
              canActivate:
                validator.userBoosts?.queuedBoostStartBlock +
                  HISTORY_BUFFER -
                  Number(blockNumber) <=
                0,
              type: "boost",
            });
          }

          if (Number(validator.userBoosts.queuedUnboosts) > 0) {
            items.push({
              ...validator,
              canActivate:
                validator.userBoosts?.queuedUnboostStartBlock +
                  HISTORY_BUFFER -
                  Number(blockNumber) <=
                0,
              type: "dropBoost",
            });
          }

          return items;
        });
  }, [data, blockNumber]);

  const onSuccess = () => {
    setIsValidatorDataLoading(true);
    setTimeout(() => {
      refresh();
      refreshBalance();
      setHasSubmittedTxn({});
      setIsValidatorDataLoading(false);
    }, 5000);
  };

  const [hasSubmittedTxn, setHasSubmittedTxn] = useState<
    Record<number, boolean>
  >({});

  const {
    write: activateWrite,
    isLoading: isActivationLoading,
    ModalPortal: ActivateModalPortal,
  } = useTxn({
    message: "Activating queued BGT to Validator",
    actionType: TransactionActionType.DELEGATE,
    onError: () => {
      setHasSubmittedTxn({});
    },
    onSuccess,
  });

  const {
    write: dropBoostWrite,
    isLoading: isDropBoostLoading,
    ModalPortal: DropBoostModalPortal,
  } = useTxn({
    message: "Confirming queued boost drop to validator",
    actionType: TransactionActionType.DELEGATE,
    onError: () => {
      setHasSubmittedTxn({} as any);
    },
    onSuccess,
  });

  const {
    write: cancelWrite,
    isLoading: isCancelLoading,
    ModalPortal: CancelModalPortal,
  } = useTxn({
    message: "Cancelling queued BGT to Validator",
    actionType: TransactionActionType.DELEGATE,
    onError: () => {
      setHasSubmittedTxn({} as any);
    },
    onSuccess,
  });

  const {
    write: cancelDropBoostWrite,
    isLoading: isCancelDropBoostLoading,
    ModalPortal: CancelDropBoostModalPortal,
  } = useTxn({
    message: "Cancelling queued drop boost to Validator",
    actionType: TransactionActionType.DELEGATE,
    onError: () => {
      setHasSubmittedTxn({} as any);
    },
    onSuccess,
  });

  const handleTransaction = (
    index: number,
    isActivate: boolean,
    props: IContractWrite,
    isDropBoost: boolean,
  ) => {
    setHasSubmittedTxn({ ...hasSubmittedTxn, [index]: true } as any);

    if (isActivate) {
      if (isDropBoost) {
        dropBoostWrite(props);
      } else {
        activateWrite(props);
      }
    } else {
      if (isDropBoost) {
        cancelDropBoostWrite(props);
      } else {
        cancelWrite(props);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {ActivateModalPortal}
      {CancelModalPortal}
      {CancelDropBoostModalPortal}
      {DropBoostModalPortal}

      {!queuedList ? (
        <div>
          <Skeleton className="h-28 w-full rounded-md" />
          <Skeleton className="h-28 w-full rounded-md" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
            {queuedList?.map((validator, index: number) => (
              <ConfirmationCard
                key={`${validator.pubkey}-${validator.type}`}
                userValidator={validator}
                index={index}
                hasSubmittedTxn={hasSubmittedTxn[index] ?? false}
                isTxnLoading={isActivationLoading || isCancelLoading}
                handleTransaction={handleTransaction}
              />
            ))}
          </div>
          {!queuedList?.length && (
            <div className="text-muted-foreground">No validators in queue</div>
          )}
        </>
      )}
    </div>
  );
};

const ConfirmationCard = ({
  userValidator,
  isTxnLoading,
  index,
  hasSubmittedTxn,
  handleTransaction,
}: {
  userValidator: QueueItem;
  isTxnLoading: boolean;
  index: number;
  hasSubmittedTxn: boolean;
  handleTransaction: (
    index: number,
    isActivate: boolean,
    props: IContractWrite<typeof BGT_ABI>,
    isDropBoost: boolean,
  ) => void;
}) => {
  const { data: block } = useBlockNumber();

  const { account } = useBeraJs();

  const amount =
    userValidator.type === "boost"
      ? userValidator.userBoosts.queuedBoosts
      : userValidator.userBoosts.queuedUnboosts;
  const startBlock =
    userValidator.type === "boost"
      ? userValidator.userBoosts.queuedBoostStartBlock
      : userValidator.userBoosts.queuedUnboostStartBlock;

  const blocksLeft = Number(startBlock) + HISTORY_BUFFER - Number(block);

  const isReadyForConfirmation = blocksLeft <= 0;

  const width = isReadyForConfirmation
    ? 100
    : Math.round(Math.abs(1 - blocksLeft / HISTORY_BUFFER) * 100);

  const timeText = (
    <span className="text-info-foreground">{blocksLeft} blocks remaining</span>
  );

  const { data } = useAllValidators();

  const pubkey = userValidator.pubkey;
  const validatorInfo = data?.validators?.validators?.find(
    (v) => v.pubkey.toLowerCase() === pubkey.toLowerCase(),
  );

  return (
    <div className="w-full rounded-md border border-border py-4 px-8">
      <div className="flex w-full justify-between">
        <div className="font-medium">
          <div className="flex items-center gap-2">
            <ValidatorIcon
              address={userValidator.pubkey as Address}
              className="h-6 w-6"
            />
            <h3 className="text-base font-medium">
              {validatorInfo?.metadata?.name ??
                truncateHash(userValidator.pubkey)}
            </h3>
          </div>
          <div className="text-muted-foreground ">
            <FormattedNumber
              showIsSmallerThanMin
              value={userValidator.type === "boost" ? amount : -Number(amount)}
              compact
              prefixText={userValidator.type === "boost" ? "+" : ""}
              colored={userValidator.type === "dropBoost"}
              symbol="BGT"
            />
          </div>
        </div>
        <div>
          <Button
            variant="ghost"
            disabled={
              isTxnLoading || !isReadyForConfirmation || hasSubmittedTxn
            }
            onClick={() =>
              handleTransaction(
                index,
                true,
                {
                  address: bgtTokenAddress,
                  abi: BGT_ABI,
                  functionName:
                    userValidator.type === "boost"
                      ? "activateBoost"
                      : "dropBoost",
                  params: [account!, userValidator.pubkey as Address],
                },
                userValidator.type === "dropBoost",
              )
            }
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            disabled={isTxnLoading || hasSubmittedTxn}
            onClick={() =>
              handleTransaction(
                index,
                false,
                {
                  address: bgtTokenAddress,
                  abi: BGT_ABI,
                  functionName:
                    userValidator.type === "boost"
                      ? "cancelBoost"
                      : "cancelDropBoost",
                  params: [
                    userValidator.pubkey as Address,
                    parseUnits(amount, 18),
                  ],
                },
                userValidator.type === "dropBoost",
              )
            }
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="mt-6 ">
        <div className="h-[9px] overflow-hidden rounded border border-border">
          <div
            className={cn(
              isReadyForConfirmation
                ? "bg-success-foreground"
                : "bg-info-foreground",
              "h-full",
            )}
            style={{ width: `${width}%` }}
          />
        </div>
        <div className="flex justify-between pt-2 text-sm font-medium leading-6">
          {blocksLeft < 0 ? (
            <div className="text-success-foreground">
              Ready for confirmation
            </div>
          ) : (
            <div>Confirmation Wait Duration</div>
          )}
          <div>{blocksLeft > 0 && timeText}</div>
        </div>
      </div>
    </div>
  );
};

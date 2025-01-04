import {
  BGT_ABI,
  IContractWrite,
  UserValidator,
  truncateHash,
  useAllValidators,
  useBlockTime,
} from "@bera/berajs";
import { useBlock } from "wagmi";
import { bgtTokenAddress } from "@bera/config";
import { FormattedNumber, ValidatorIcon } from "@bera/shared-ui";
import { Address, parseUnits } from "viem";
import { Button } from "@bera/ui/button";
import { cn } from "@bera/ui";

export const HISTORY_BUFFER = 8192;

export const ConfirmationCard = ({
  userValidator,
  isTxnLoading,
  index,
  hasSubmittedTxn,
  handleTransaction,
}: {
  userValidator: UserValidator;
  isTxnLoading: boolean;
  index: number;
  hasSubmittedTxn: boolean;
  handleTransaction: (
    index: number,
    isActivate: boolean,
    props: IContractWrite,
  ) => void;
}) => {
  const blockTime = useBlockTime();
  const blockNumber = useBlock()?.data?.number;
  const blocksLeft =
    parseInt(userValidator.latestBlock) + HISTORY_BUFFER - Number(blockNumber);
  const canActivate = blocksLeft <= 0;
  const width = canActivate
    ? 100
    : Math.round(Math.abs(1 - blocksLeft / HISTORY_BUFFER) * 100);

  const time =
    parseInt(userValidator.latestBlockTime) + HISTORY_BUFFER * blockTime;

  const timeText = (
    <span className="text-info-foreground">{blocksLeft} blocks remaining</span>
  );

  const { data } = useAllValidators();

  const pubkey = userValidator.pubkey;
  const validatorInfo = data?.validators?.validators?.find(
    (v) => v.pubkey.toLowerCase() === pubkey.toLowerCase(),
  );

  return (
    <div className="w-full rounded-md border border-border p-4">
      <div className="flex w-full justify-between">
        <div className="font-medium">
          <div className="flex items-center gap-2">
            <ValidatorIcon
              address={pubkey as Address}
              className="h-8 w-8"
              //   imgOverride={userValidator.metadata?.logoURI}
            />
            <div>{validatorInfo?.metadata?.name ?? truncateHash(pubkey)}</div>
          </div>
          <div className="ml-8 text-muted-foreground ">
            <FormattedNumber
              showIsSmallerThanMin
              value={userValidator.amountQueued}
              compact
            />{" "}
            BGT
          </div>
        </div>
        <div>
          <Button
            variant="ghost"
            disabled={isTxnLoading || !canActivate || hasSubmittedTxn}
            onClick={() =>
              handleTransaction(index, true, {
                address: bgtTokenAddress,
                abi: BGT_ABI,
                functionName: "activateBoost",
                params: [pubkey, parseUnits(userValidator.amountQueued, 18)],
              })
            }
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            disabled={isTxnLoading || hasSubmittedTxn}
            onClick={() =>
              handleTransaction(index, false, {
                address: bgtTokenAddress,
                abi: BGT_ABI,
                functionName: "cancelBoost",
                params: [pubkey, parseUnits(userValidator.amountQueued, 18)],
              })
            }
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="mt-6 pl-8 pr-4">
        <div className="h-[9px] overflow-hidden rounded border border-border">
          <div
            className={cn(
              canActivate ? "bg-success-foreground" : "bg-info-foreground",
              "h-full",
            )}
            style={{ width: `${width}%` }}
          />
        </div>
        <div className="flex justify-between pt-2 text-sm font-medium leading-6">
          {canActivate ? (
            <div className="text-success-foreground">
              Ready for confirmation
            </div>
          ) : (
            <div>Confirmation Wait Duration</div>
          )}
          <div>{!canActivate && timeText}</div>
        </div>
      </div>
    </div>
  );
};

import { useCallback, useMemo, useState } from "react";
import {
  TransactionActionType,
  beaconDepositAbi,
  truncateHash,
  useBeraJs,
  useValidatorOperatorAddress,
  useValidatorQueuedOperatorAddress,
} from "@bera/berajs";
import { blockExplorerUrl, depositContractAddress } from "@bera/config";
import { useTxn } from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import { Card, CardContent, CardFooter } from "@bera/ui/card";
import { Checkbox } from "@bera/ui/checkbox";
import { Icons } from "@bera/ui/icons";
import { InputWithLabel } from "@bera/ui/input";
import { Address, isAddress, zeroAddress } from "viem";

export const GeneralSettings = ({
  validatorPublicKey,
  isQueuedOperatorWallet,
  isValidatorWallet,
}: {
  validatorPublicKey: Address;
  isQueuedOperatorWallet: boolean;
  isValidatorWallet: boolean;
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const { account } = useBeraJs();
  const { data: operatorAddress, refresh: refreshOperatorAddress } =
    useValidatorOperatorAddress(validatorPublicKey);
  const { data: queuedOperatorAddress, refresh: refreshQueuedOperatorAddress } =
    useValidatorQueuedOperatorAddress(validatorPublicKey);
  const [operatorInput, setOperatorInput] = useState<string>("");

  const isQueuedOperator = useMemo(() => {
    return (
      queuedOperatorAddress?.[1] && queuedOperatorAddress?.[1] !== zeroAddress
    );
  }, [queuedOperatorAddress]);

  const timeRemaining = useMemo(() => {
    if (!queuedOperatorAddress) return 0;
    const currentBlockTimestamp = Number(queuedOperatorAddress[0]) * 1000; // Convert seconds to milliseconds
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return currentBlockTimestamp + twentyFourHoursInMs;
  }, [queuedOperatorAddress]);

  const canQueueOperatorChange = Date.now() > timeRemaining;

  const {
    write,
    isLoading: isApplyingOperatorChange,
    ModalPortal,
  } = useTxn({
    message: "Applying Operator Change",
    actionType: TransactionActionType.APPLYING_OPERATOR_CHANGE,
    onSuccess: () => {
      refreshOperatorAddress();
      refreshQueuedOperatorAddress();
    },
  });

  const handleSaveSettings = useCallback(() => {
    write({
      address: depositContractAddress,
      abi: beaconDepositAbi,
      functionName: "requestOperatorChange",
      params: [validatorPublicKey, operatorInput as Address],
    });
  }, [operatorInput, validatorPublicKey]);

  const handleConfirmQueuedOperatorChange = useCallback(() => {
    write({
      address: depositContractAddress,
      abi: beaconDepositAbi,
      functionName: "acceptOperatorChange",
      params: [validatorPublicKey],
    });
  }, [validatorPublicKey]);

  const handleCancelQueuedOperatorChange = useCallback(() => {
    write({
      address: depositContractAddress,
      abi: beaconDepositAbi,
      functionName: "cancelOperatorChange",
      params: [validatorPublicKey],
    });
  }, [validatorPublicKey]);

  const isValidAddress = useMemo(
    () =>
      isAddress(operatorInput) &&
      operatorInput !== zeroAddress &&
      operatorInput !== account,
    [operatorInput],
  );

  return (
    <div className="flex flex-col gap-6">
      {isQueuedOperator && (
        <Card className="flex flex-col gap-1">
          <CardContent className="flex flex-col items-center justify-between pb-4 pt-2 md:flex-row">
            <div className="flex flex-col gap-1">
              <div className="mt-2 flex items-center text-sm font-semibold">
                <Icons.info className="mr-1 h-4 w-4" />
                {canQueueOperatorChange
                  ? "Confirm Operator Address Change"
                  : "Queued Operator Address Change"}
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Operator Address is queued to change to{" "}
                  <a
                    href={`${blockExplorerUrl}/address/${queuedOperatorAddress?.[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:text-primary"
                  >
                    {queuedOperatorAddress?.[1]}
                  </a>
                  . The queued operator will be able to apply the change at{" "}
                  {new Date(timeRemaining).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 ml-1 flex gap-2 self-end md:self-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleConfirmQueuedOperatorChange}
                className="flex border-border px-4 py-2"
                disabled={!(canQueueOperatorChange && isQueuedOperatorWallet)}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelQueuedOperatorChange}
                className="flex border-border px-4 py-2"
                disabled={!isValidatorWallet} // TODO: check if queued Operator can cancel queued operator
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="flex flex-col gap-1">
        {ModalPortal}
        <CardContent className="flex flex-col gap-1 p-6">
          <span className="text-2xl font-bold">General Settings</span>
          <span className="text-sm text-muted-foreground">
            Configure your operator address
          </span>
          <span className="mt-2 flex font-semibold">Operator Address</span>
          <InputWithLabel
            value={operatorInput}
            placeholder={truncateHash("0x00000000000000")}
            onChange={(e) => setOperatorInput(e.target.value)}
            className="w-[300px]"
            disabled={isQueuedOperatorWallet}
            error={
              !isValidAddress && !(operatorInput === "")
                ? "Please enter a valid address"
                : isQueuedOperatorWallet
                  ? "Unable to change address as the current queued operator"
                  : undefined
            }
          />
        </CardContent>
        <CardFooter className="flex w-full justify-between border-t border-border pt-6">
          <div className="flex items-center gap-2">
            <Checkbox
              className="mr-1"
              id="confirm"
              checked={confirmed}
              disabled={isQueuedOperatorWallet}
              onCheckedChange={() => setConfirmed(!confirmed)}
            />
            <span
              className="mr-2 cursor-pointer text-sm text-muted-foreground"
              onClick={() =>
                isQueuedOperatorWallet
                  ? setConfirmed(false)
                  : setConfirmed(!confirmed)
              }
            >
              I understand that changing operator address is equivalent to
              handing over ownership rights to the validator
            </span>
          </div>
          <Button
            className="flex w-[100px] self-center border border-border p-2"
            size={"sm"}
            title={
              !confirmed
                ? "Please confirm the change"
                : isApplyingOperatorChange
                  ? "Applying Operator Change"
                  : !isValidAddress
                    ? "Please enter a valid address"
                    : undefined
            }
            disabled={!confirmed || isApplyingOperatorChange || !isValidAddress}
            onClick={handleSaveSettings}
          >
            {"Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

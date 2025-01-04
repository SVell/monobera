import React from "react";
import Image from "next/image";
import {
  BGT_ABI,
  TransactionActionType,
  type UserValidator,
  useBeraJs,
  useUserActiveValidators,
  useUserBoostsOnValidator,
} from "@bera/berajs";
import { bgtTokenAddress } from "@bera/config";
import { ActionButton, useTxn } from "@bera/shared-ui";
import { Alert } from "@bera/ui/alert";
import { Button } from "@bera/ui/button";
import { useTheme } from "next-themes";
import { Address, parseUnits } from "viem";

import ValidatorInput from "~/components/validator-input";
import { DelegateEnum, ImageMapEnum } from "../types";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";

export const UnboostContent = ({
  validator,
  setIsValidatorDataLoading,
  onSuccess,
}: {
  validator: ApiValidatorFragment;
  setIsValidatorDataLoading: (loading: boolean) => void;
  onSuccess?: () => void;
}) => {
  const { isConnected, account } = useBeraJs();
  const { theme, systemTheme } = useTheme();
  const t = theme === "system" ? systemTheme : theme;

  const [amount, setAmount] = React.useState<string | undefined>(undefined);

  const { data: userBoosts, refresh } = useUserBoostsOnValidator({
    pubkey: validator?.pubkey as Address,
  });

  const {
    write: unbondWrite,
    isLoading: isUnbondLoading,
    ModalPortal: UnBondModalPortal,
  } = useTxn({
    message: "Unbonding from Validator",
    actionType: TransactionActionType.UNBONDING,
    onSuccess: () => {
      setIsValidatorDataLoading(true);
      setTimeout(() => {
        refresh();
        setIsValidatorDataLoading(false);
      }, 5000);
      onSuccess?.();
    },
  });

  const bgtDelegated = userBoosts
    ? Number(userBoosts?.activeBoosts) - Number(userBoosts.queuedUnboosts)
    : 0;

  return (
    <div>
      {UnBondModalPortal}
      <div className="flex flex-col gap-3">
        <div className="text-lg font-semibold capitalize leading-7 text-foreground">
          Unboost
        </div>
        <Image
          src={ImageMapEnum.UNBOND.light}
          alt="bera banner"
          width={452}
          height={175}
          className="block w-full dark:hidden"
          priority
          loading="eager"
        />
        <Image
          src={ImageMapEnum.UNBOND.dark}
          alt="bera banner"
          width={452}
          height={175}
          className="hidden w-full dark:block"
          priority
          loading="eager"
        />
        <ValidatorInput
          action={DelegateEnum.UNBOND}
          amount={amount}
          onAmountChange={setAmount}
          validatorAddress={validator.pubkey as Address}
          showDelegated
          showSearch={false}
          unselectable
        />

        {isConnected && Number(amount) > Number(bgtDelegated) && (
          <Alert variant="destructive">Insufficient boosts</Alert>
        )}

        <ActionButton>
          <Button
            className="w-full"
            disabled={
              !account || // no account connected
              !validator || // no validator selected
              isUnbondLoading || // unbond action processing
              Number(amount) > Number(bgtDelegated) ||
              !amount ||
              amount === ""
            }
            onClick={() =>
              unbondWrite({
                address: bgtTokenAddress,
                abi: BGT_ABI,
                functionName: "queueDropBoost",
                params: [
                  validator.pubkey as Address,
                  parseUnits(amount ?? "0", 18),
                ],
              })
            }
          >
            Unboost
          </Button>
        </ActionButton>
      </div>
    </div>
  );
};

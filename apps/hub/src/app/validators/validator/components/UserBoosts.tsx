import { useEffect, useState } from "react";
import { useUserBoostsOnValidator } from "@bera/berajs";
import { FormattedNumber, Spinner } from "@bera/shared-ui";
import { Icons } from "@bera/ui/icons";
import { Skeleton } from "@bera/ui/skeleton";
import { Address } from "viem";

import { BoostModal } from "./BoostModal";
import { UnbondModal } from "./UnboostModal";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";
import { QueueItem } from "./QueueItem";

export const UserBoosts = ({
  validator,
}: { validator: ApiValidatorFragment | undefined }) => {
  const valPubKey = validator?.pubkey as Address;

  const [isValidatorDataLoading, setIsValidatorDataLoading] = useState(false);

  const {
    data: userBoosts,
    isLoading,
    refresh,
  } = useUserBoostsOnValidator({
    pubkey: valPubKey,
  });

  useEffect(() => {
    if (isValidatorDataLoading) {
      refresh();
    }
  }, [isValidatorDataLoading, refresh]);

  return (
    <div className="flex flex-col gap-4 rounded-sm border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-2 text-xl font-semibold">Your Boosts</div>
          {isValidatorDataLoading && <Spinner size={18} color="white" />}
        </div>
        <div className="flex gap-2">
          {Number(userBoosts?.activeBoosts) > 0 ? (
            <UnbondModal
              validator={validator}
              setIsValidatorDataLoading={setIsValidatorDataLoading}
            />
          ) : null}
          <BoostModal
            validator={valPubKey}
            setIsValidatorDataLoading={setIsValidatorDataLoading}
          />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : userBoosts ? (
        <>
          {!userBoosts.hasActiveBoosts && !userBoosts.hasPendingBoosts ? (
            <div className="flex h-full w-full items-center justify-center text-center text-sm font-medium leading-5 text-muted-foreground">
              You have no current or queued delegations
              <br />
              in this validator.
            </div>
          ) : (
            <>
              <div className="w-full">
                <div className="font-medium leading-6">
                  <div className="flex items-center gap-2">
                    <Icons.bgt className="ml-1 h-6 w-6" />
                    <FormattedNumber
                      value={userBoosts?.activeBoosts ?? 0}
                      symbol="BGT"
                    />{" "}
                  </div>
                </div>
              </div>
              {userBoosts.hasPendingBoosts ? (
                <>
                  <hr />
                  <h3 className="text-lg font-semibold">Queued</h3>
                  {Number(userBoosts?.queuedBoosts) > 0 ? (
                    <QueueItem
                      amount={userBoosts?.queuedBoosts ?? "0"}
                      startBlock={userBoosts?.queuedBoostStartBlock ?? 0}
                      valPubKey={valPubKey}
                      isDropBoost={false}
                      onSuccess={() => {
                        refresh();
                      }}
                    />
                  ) : null}
                  {Number(userBoosts?.queuedUnboosts) > 0 ? (
                    <QueueItem
                      amount={userBoosts?.queuedUnboosts ?? "0"}
                      startBlock={userBoosts?.queuedUnboostStartBlock ?? 0}
                      valPubKey={valPubKey}
                      isDropBoost={true}
                      onSuccess={() => {
                        refresh();
                      }}
                    />
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-center text-sm font-medium leading-5 text-muted-foreground">
          Connect your wallet to see your boosts.
        </div>
      )}
    </div>
  );
};

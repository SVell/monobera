import { useCallback } from "react";
import Link from "next/link";
import { Card } from "@bera/ui/card";
import { Icons } from "@bera/ui/icons";
import { Address } from "viem";

import { GeneralSettings } from "./GeneralSettings";
import { RewardAllocationConfiguration } from "./RewardAllocationConfiguration";
import { QueuedRewardAllocationConfiguration } from "./queued-reward-allocation-configuration";

export const ValidatorConfiguration = ({
  validatorPublicKey,
  isQueuedOperatorWallet,
  isValidatorWallet,
}: {
  validatorPublicKey: Address;
  isQueuedOperatorWallet: boolean;
  isValidatorWallet: boolean;
}) => {
  const handleUpdateMetadata = useCallback(() => {
    console.log("updating metadata", validatorPublicKey);
  }, []);

  return (
    <div className="mt-10 flex flex-col gap-6">
      <QueuedRewardAllocationConfiguration
        validatorPublicKey={validatorPublicKey}
      />
      <RewardAllocationConfiguration
        validatorPublicKey={validatorPublicKey}
        isQueuedOperatorWallet={isQueuedOperatorWallet}
      />
      <GeneralSettings
        validatorPublicKey={validatorPublicKey}
        isQueuedOperatorWallet={isQueuedOperatorWallet}
        isValidatorWallet={isValidatorWallet}
      />
      <Link href={"https://github.com/berachain/default-lists"}>
        <Card className="flex flex-col gap-1 p-4">
          <div className="flex-center flex">
            <span className="text-2xl font-bold">
              Update your validator metadata
            </span>
            <div
              className="mb-1 mt-1 flex cursor-pointer items-center text-xl font-bold"
              onClick={handleUpdateMetadata}
            >
              <Icons.arrowRight className="ml-1 cursor-pointer" />
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            Configure and modify your validator metadata
          </span>
        </Card>
      </Link>
    </div>
  );
};

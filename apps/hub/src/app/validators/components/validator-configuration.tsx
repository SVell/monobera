import { useCallback } from "react";
import Link from "next/link";
import { Card } from "@bera/ui/card";
import { Icons } from "@bera/ui/icons";
import { Address } from "viem";

import { GeneralSettings } from "./GeneralSettings";
import { QueuedRewardAllocationConfiguration } from "./queued-reward-allocation-configuration";
import { RewardAllocationConfiguration } from "./RewardAllocationConfiguration";

export const ValidatorConfiguration = ({
  validatorPublicKey,
}: {
  validatorPublicKey: Address;
}) => {
  const handleUpdateMetadata = useCallback(() => {
    console.log("updating metadata", validatorPublicKey);
  }, []);

  return (
    <div className="mt-10 flex flex-col gap-6">
      <QueuedRewardAllocationConfiguration
        validatorPublicKey={validatorPublicKey}
      />
      <RewardAllocationConfiguration validatorPublicKey={validatorPublicKey} />
      <GeneralSettings validatorPublicKey={validatorPublicKey} />
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

import { useCallback } from "react";
import { Card } from "@bera/ui/card";
import { Address } from "viem";
import { QueuedRewardAllocationConfiguration } from "./queued-reward-allocation-configuration";
import { RewardAllocationConfiguration } from "./reward-allocation-configuration";
import { GeneralSettings } from "./general-settings";
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
      <Card className="flex flex-col gap-1 p-4">
        <span className="text-2xl font-bold">Update your metadata</span>
        <span className="text-sm text-muted-foreground">
          Configure and modify your validator metadata
        </span>
        <div
          className="mt-2 flex cursor-pointer items-center text-xl font-bold mb-1"
          onClick={handleUpdateMetadata}
        >
          {"Coming Soon"}
          {/* <Icons.arrowRight className="ml-1 cursor-pointer" /> */}
        </div>
      </Card>
    </div>
  );
};

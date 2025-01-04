import { RewardVault, useTokenInformation } from "@bera/berajs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bera/ui/tabs";

import { DepositLP } from "./deposit-lp";
import { WithdrawLP } from "./withdraw-lp";
import { ApiVaultFragment } from "@bera/graphql/pol/api";

export const GaugueLPChange = ({
  rewardVault,
}: { rewardVault: ApiVaultFragment }) => {
  const { data: lpToken } = useTokenInformation({
    address: rewardVault.stakingToken.address,
  });

  return (
    <div className="w-full">
      <Tabs defaultValue="deposit" className="flex w-full flex-col gap-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Stake</TabsTrigger>
          <TabsTrigger value="withdraw">Unstake</TabsTrigger>
        </TabsList>
        <TabsContent value="deposit">
          {lpToken && <DepositLP lpToken={lpToken} rewardVault={rewardVault} />}
        </TabsContent>
        <TabsContent value="withdraw">
          {lpToken && (
            <WithdrawLP lpToken={lpToken} rewardVault={rewardVault} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

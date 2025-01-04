import { useBeraJs, usePollVaultsInfo, useTokenHoneyPrice } from "@bera/berajs";
import { beraTokenAddress } from "@bera/config";
import { FormattedNumber } from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import { Icons } from "@bera/ui/icons";
import BigNumber from "bignumber.js";

import { GaugueLPChange } from "./gauge-lp-change";
import { ClaimBGTModal } from "../../components/claim-modal";
import { useState } from "react";
import { ApiVaultFragment } from "@bera/graphql/pol/api";
import { Address } from "viem";

export const MyGaugeDetails = ({
  rewardVault,
}: {
  rewardVault: ApiVaultFragment;
}) => {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const { isReady } = useBeraJs();

  const { data } = usePollVaultsInfo({
    vaultAddress: rewardVault.vaultAddress as Address,
  });
  const { data: price } = useTokenHoneyPrice({
    tokenAddress: beraTokenAddress,
  });

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <GaugueLPChange rewardVault={rewardVault} />
      {isReady && data ? (
        <div className="flex w-full flex-col gap-4 lg:max-w-[440px]">
          <div className="flex flex-col gap-8 rounded-md border border-border p-4">
            <div className="text-lg font-semibold leading-7">
              My Reward Vault Deposits
            </div>
            <div className="flex justify-between font-medium leading-6">
              <div>{rewardVault?.metadata?.name}</div>
              <div className="flex flex-row items-center gap-2">
                <FormattedNumber
                  value={data?.balance ?? 0}
                  showIsSmallerThanMin
                />
                <FormattedNumber
                  value={data?.percentage ?? 0}
                  percent
                  showIsSmallerThanMin
                  className="text-sm text-muted-foreground"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-8 rounded-md border border-border p-4">
            <div className="text-lg font-semibold leading-7">
              Unclaimed Rewards
            </div>
            <div className="flex justify-between font-medium leading-6">
              <div className="flex items-center gap-2">
                <Icons.bgt className="h-6 w-6" />
                BGT
              </div>
              <div className="flex flex-row items-center gap-2">
                <FormattedNumber
                  value={data?.rewards ?? 0}
                  showIsSmallerThanMin
                />
                <FormattedNumber
                  value={BigNumber(data?.rewards ?? "0").times(price ?? 0)}
                  symbol="USD"
                  showIsSmallerThanMin
                  className="text-sm text-muted-foreground"
                />
              </div>
            </div>
            <Button
              disabled={!data.rewards || Number(data.rewards) <= 0}
              onClick={() => setIsClaimModalOpen(true)}
            >
              Claim Rewards
            </Button>

            <ClaimBGTModal
              isOpen={isClaimModalOpen}
              onOpenChange={setIsClaimModalOpen}
              rewardVault={rewardVault.vaultAddress as Address}
            />
          </div>
        </div>
      ) : (
        <div className="lg:max-w-[440px] w-full" />
      )}
    </div>
  );
};

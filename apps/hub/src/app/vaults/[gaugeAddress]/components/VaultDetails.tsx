"use client";

import { notFound } from "next/navigation";
import {
  truncateHash,
  useRewardVault,
  useVaultValidators,
  useRewardVaultIncentives,
  useMultipleTokenInformation,
  useBeraJs,
  Token,
} from "@bera/berajs";
import { lendRewardsAddress, blockExplorerUrl } from "@bera/config";
import { DataTable, GaugeIcon, MarketIcon, PoolHeader } from "@bera/shared-ui";
import { getHubValidatorPath } from "@bera/shared-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bera/ui/tabs";
import { SWRConfig } from "swr";
import { Address } from "viem";

import { gauge_incentives_columns } from "~/columns/gauge-incentives-columns";
import { getGaugeValidatorColumns } from "~/columns/general-validator-columns";
import Loading from "../loading";
import { BendRewardsBanner } from "./banner";
import { MyGaugeDetails } from "./my-gauge-details";
import { Card, CardContent } from "@bera/ui/card";
import { Button } from "@bera/ui/button";
import Link from "next/link";

export const VaultDetails = ({
  address,
}: {
  address: Address;
}) => {
  return (
    <SWRConfig value={{}}>
      <_GaugeDetails address={address} />
    </SWRConfig>
  );
};

const _GaugeDetails = ({ address }: { address: Address }) => {
  const {
    data: rewardVault,
    isLoading: isRewardVaultLoading,
    isValidating: rewardVaultError,
  } = useRewardVault(address);

  const { account } = useBeraJs();

  const {
    data: validators = [],
    isLoading: isValidatorsLoading,
    isValidating: isValidatorsValidating,
  } = useVaultValidators(address);

  const { data: incentivesData } = useRewardVaultIncentives({
    address: rewardVault?.vaultAddress as Address,
  });

  const { data: incentiveTokens } = useMultipleTokenInformation({
    addresses: incentivesData?.map((incentive) => incentive.token),
  });

  const activeIncentives = incentivesData?.map((incentive) => {
    const token =
      incentiveTokens?.find((token) => token.address === incentive.token) ??
      ({ address: incentive.token } as Token);
    return {
      ...incentive,
      amountRemaining: Number(incentive.amountRemaining),
      incentiveRate: Number(incentive.incentiveRate),
      token,
      id: incentive.token,
    };
  });

  if (!rewardVault && !isRewardVaultLoading && rewardVaultError) {
    console.error("Reward vault error", rewardVaultError, rewardVault);
    return notFound();
  }

  return (
    <>
      {rewardVault ? (
        <div className="flex flex-col gap-11 mb-12">
          <PoolHeader
            isVault
            title={
              <>
                <GaugeIcon
                  address={rewardVault?.vaultAddress as Address}
                  size="xl"
                  overrideImage={rewardVault?.metadata?.logoURI}
                />
                {rewardVault?.metadata?.name ?? truncateHash(address)}
              </>
            }
            subtitles={[
              {
                title: "Platform",
                content: (
                  <>
                    <MarketIcon
                      market={rewardVault?.metadata?.productName ?? ""}
                      size={"md"}
                    />
                    {rewardVault?.metadata?.productName ?? "OTHER"}
                  </>
                ),
                externalLink: rewardVault?.metadata?.url ?? "",
              },
              {
                title: "Reward Vault",
                content: <>{truncateHash(rewardVault?.vaultAddress ?? "")}</>,
                externalLink: `${blockExplorerUrl}/address/${rewardVault?.vaultAddress}`,
              },
              {
                title: "Staking Contract",
                content: (
                  <>{truncateHash(rewardVault?.stakingToken.address ?? "")}</>
                ),
                externalLink: `${blockExplorerUrl}/address/${rewardVault?.stakingToken.address}`,
              },
            ]}
            className="border-b border-border pb-8"
          />

          {activeIncentives
            ?.filter((inc) => account && inc.manager === account)
            .map((inc, idx) => (
              <Card key={idx}>
                <CardContent className="md:flex w-full items-center justify-between p-4 pt-4">
                  <div className="flex flex-col items-start pr-4">
                    <div className="text-muted-foregorund font-medium">
                      Add {inc.token.name ? `${inc.token.name} ` : ""}incentives
                      to this rewards vault
                    </div>
                    <div className="text-sm text-muted-foreground">
                      You are currently logged in with a token manager wallet
                      enabling you to add incentives.
                    </div>
                  </div>
                  <Button
                    as={Link}
                    className=" max-md:mt-4 max-md:w-full whitespace-nowrap"
                    href={`/incentivize?gauge=${address}&token=${inc.token.address}`}
                  >
                    Add {inc.token.name ?? "incentives"}
                  </Button>
                </CardContent>
              </Card>
            ))}

          {address.toLowerCase() !== lendRewardsAddress.toLowerCase() ? (
            <MyGaugeDetails rewardVault={rewardVault} />
          ) : (
            <BendRewardsBanner />
          )}

          <Tabs defaultValue="incentives" className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <TabsList className="w-full md:w-fit">
                <TabsTrigger value="incentives" className="w-full md:w-fit">
                  Incentives
                </TabsTrigger>
                <TabsTrigger value="validators" className="w-full md:w-fit">
                  Validators
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="incentives">
              <DataTable
                loading={isRewardVaultLoading}
                validating={rewardVaultError}
                columns={gauge_incentives_columns}
                data={activeIncentives ?? []}
                className="max-h-[300px] min-w-[1000px] shadow"
              />
            </TabsContent>
            <TabsContent value="validators">
              <DataTable
                columns={getGaugeValidatorColumns(rewardVault)}
                loading={isValidatorsLoading}
                validating={isValidatorsValidating}
                data={validators}
                className="min-w-[800px] shadow"
                onRowClick={(row: any) =>
                  window.open(getHubValidatorPath(row.original.id), "_blank")
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
};

import { useEffect, useMemo, useState } from "react";
import {
  BERA_CHEF_ABI,
  TransactionActionType,
  useDefaultRewardAllocation,
  usePollGaugesData,
  useRewardAllocationBlockDelay,
  useValidatorQueuedRewardAllocation,
  useValidatorRewardAllocation,
} from "@bera/berajs";
import { beraChefAddress } from "@bera/config";
import { Combobox, useTxn } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { BeraChart } from "@bera/ui/bera-chart";
import { Button } from "@bera/ui/button";
import { Card, CardContent, CardFooter } from "@bera/ui/card";
import { Icons } from "@bera/ui/icons";
import { Input } from "@bera/ui/input";
import { Skeleton } from "@bera/ui/skeleton";
import BigNumber from "bignumber.js";
import { v4 as uuidv4 } from "uuid";
import { Address } from "viem";
import { useBlockNumber } from "wagmi";

const USER_BLOCK_DELAY = 100n;

export const RewardAllocationConfiguration = ({
  validatorPublicKey,
  isQueuedOperatorWallet,
}: {
  validatorPublicKey: Address;
  isQueuedOperatorWallet: boolean;
}) => {
  const [vaults, setVaults] = useState<
    { address: string; distribution: number; id: string }[]
  >([{ address: "", distribution: 0, id: uuidv4() }]);
  const { data: rewardVaults, isLoading } = usePollGaugesData();
  const { data: blockNumber } = useBlockNumber({
    query: { refetchInterval: 10000 },
  });
  const { data: rewardAllocationBlockDelay } = useRewardAllocationBlockDelay();
  const { data: defaultRewardAllocation } = useDefaultRewardAllocation();

  const {
    data: queuedRewardAllocation,
    isLoading: queuedRewardAllocationLoading,
    refresh: refreshQueuedRewardAllocation,
  } = useValidatorQueuedRewardAllocation(validatorPublicKey);

  const isQueuedRewardAllocation = useMemo(
    () =>
      queuedRewardAllocation?.weights &&
      queuedRewardAllocation?.weights.length > 0 &&
      !queuedRewardAllocationLoading,
    [queuedRewardAllocation, queuedRewardAllocationLoading],
  );

  const {
    write,
    isLoading: isApplyingQueuedRewardAllocation,
    ModalPortal,
  } = useTxn({
    message: "Applying Reward Allocation",
    actionType: TransactionActionType.APPLYING_REWARD_ALLOCATION,
    onSuccess: () => {
      refreshQueuedRewardAllocation();
    },
  });

  const { data: rewardAllocation, isLoading: rewardAllocationLoading } =
    useValidatorRewardAllocation(validatorPublicKey, {
      opts: { revalidateOnMount: true },
    });

  const [error, setError] = useState<string>("");
  const rgbColorPalette = [
    "rgb(248 113 113)", // bg-red-400
    "rgb(96 165 250)", // bg-blue-400
    "rgb(251 146 60)", // bg-orange-400
    "rgb(167 139 250)", // bg-violet-400
    "rgb(250 204 21)", // bg-yellow-400
    "rgb(74 222 128)", // bg-green-400
    "rgb(56 189 248)", // bg-sky-400
    "rgb(45 212 191)", // bg-teal-400
    "rgb(255 210 204)", // bg-pink-400
    "rgb(156 163 175)", // bg-gray-400
  ];

  useEffect(() => {
    if (rewardAllocation?.weights) {
      setVaults(
        rewardAllocation.weights.map((weight) => ({
          address: weight.receiver.toLowerCase(),
          distribution: Number(weight.percentageNumerator) / 100,
          id: uuidv4(),
        })),
      );
    }
  }, [rewardAllocation]);

  const vaultsData = useMemo(() => {
    return rewardVaults?.vaults?.map((vault) => ({
      vaultAddress: vault.vaultAddress.toLowerCase(),
      stakingTokenAddress: vault.stakingToken?.address?.toLowerCase(),
      symbol: vault.stakingToken.symbol,
      name: vault.stakingToken.name,
    }));
  }, [rewardVaults]);

  const handleAddVault = () => {
    setVaults([...vaults, { address: "", distribution: 0, id: uuidv4() }]);
  };

  const handleDeleteVault = (index: number) => {
    if (vaults.length === 1) return;
    setVaults(vaults.filter((_, i) => i !== index));
  };

  const handleVaultChange = (
    index: number,
    field: "address" | "distribution",
    value: string | number,
  ) => {
    const updatedVaults = vaults.map((vault, i) => {
      if (i === index) {
        return { ...vault, [field]: value };
      }
      return vault;
    });
    setVaults(updatedVaults);
  };

  const totalDistributionBN = vaults.reduce((sum, vault) => {
    return BigNumber(vault.distribution).plus(sum);
  }, BigNumber(0));
  const totalDistribution = totalDistributionBN.isNaN()
    ? ""
    : totalDistributionBN.toNumber();

  const handleDistributeVaults = () => {
    const baseDistribution = Math.floor((100 * 100) / vaults.length) / 100; // Get base with 2 decimal places
    const remainder = 100 - baseDistribution * vaults.length;

    const updatedVaults = vaults.map((vault, index) => {
      // Add the remainder to the first vault to ensure total is exactly 100
      const distribution =
        index === 0 ? baseDistribution + remainder : baseDistribution;
      return { ...vault, distribution: parseFloat(distribution.toFixed(2)) };
    });

    setVaults(updatedVaults);
  };

  const handleQueue = () => {
    const formattedVaults = vaults.map((vault) => ({
      receiver: vault.address as Address,
      percentageNumerator: BigInt(vault.distribution * 100),
    }));
    if (!blockNumber || !rewardAllocationBlockDelay) return;
    write({
      address: beraChefAddress,
      abi: BERA_CHEF_ABI,
      functionName: "queueNewRewardAllocation",
      params: [
        validatorPublicKey,
        (blockNumber || 0n) +
          (rewardAllocationBlockDelay || 0n) +
          USER_BLOCK_DELAY,
        formattedVaults,
      ],
    });
  };

  const handleResetToDefault = () => {
    setVaults(
      defaultRewardAllocation?.weights.map((weight) => ({
        address: weight.receiver.toLowerCase(),
        distribution: Number(weight.percentageNumerator) / 100,
        id: uuidv4(),
      })) || [],
    );
  };

  const pieChartData = useMemo(() => {
    return {
      labels: vaults.map(
        (vault) =>
          vaultsData?.find((item) => item.vaultAddress === vault.address)
            ?.name || "Unassigned",
      ),
      datasets: [
        {
          data: vaults.map((vault) => vault.distribution),
          hoverBorderWidth: 5,
          borderRadius: 8,
          spacing: 5,
          borderWidth: 0,
          backgroundColor: vaults.map((vault, index) => rgbColorPalette[index]),
          hoverBorderColor: vaults.map(
            (vault, index) => rgbColorPalette[index],
          ),
        },
      ],
    };
  }, [vaults, vaultsData]);

  const pieChartOptions = {
    responsive: true,
    cutout: "70%",
    radius: "95%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 1)",
        cornerRadius: 6,
        interaction: {
          intersect: true,
        },
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  useEffect(() => {
    const hasEmptyAddress = vaults.some((vault) => vault.address === "");
    const hasEmptyDistribution = vaults.some(
      (vault) => vault.distribution === 0,
    );
    if (totalDistribution !== 100) {
      setError("Total distribution must equal 100%");
    } else if (hasEmptyAddress) {
      setError("All vaults must have an address");
    } else if (hasEmptyDistribution) {
      setError("All vaults must have a distribution");
    } else {
      setError("");
    }
  }, [totalDistribution, vaults, setError]);

  return (
    <Card>
      {ModalPortal}
      <CardContent className="grid grid-cols-1 gap-1 pt-6">
        <span className="text-2xl font-bold">Berachef Weight</span>
        <span className="text-sm text-muted-foreground">
          Configure your reward vaults distribution weighting
        </span>
        <div className="flex flex-col gap-4 xl:flex-row xl:gap-0">
          {/* Vaults Addresses */}
          <div className="mt-6 flex flex-grow flex-col gap-4">
            {vaults.map((vault, index) => (
              <div
                key={vault.id}
                className="flex w-[calc(100%-200px)] gap-4 xl:w-[calc(100%-266px)]"
              >
                <div className="flex w-full flex-shrink-0 flex-col gap-1">
                  <div className="text-sm font-medium">
                    Reward Vault Address
                  </div>
                  {isLoading || rewardAllocationLoading ? (
                    <Skeleton className="h-[42px] w-32 xl:w-48" />
                  ) : (
                    <Combobox
                      items={
                        vaultsData?.map((vaultData) => ({
                          value: vaultData.vaultAddress,
                          label: `${vaultData.symbol} - ${vaultData.name}`,
                        })) || []
                      }
                      value={vaults[index].address}
                      selectedItems={vaults.map((vault) => vault.address)}
                      disabled={
                        isQueuedRewardAllocation || isQueuedOperatorWallet
                      }
                      onSelect={(selectedValue) =>
                        handleVaultChange(index, "address", selectedValue)
                      }
                    />
                  )}
                </div>
                <div className="flex w-full flex-col gap-1">
                  <div className="text-sm font-medium">Distribution</div>
                  <Input
                    type="number"
                    value={vault.distribution}
                    disabled={
                      isQueuedRewardAllocation || isQueuedOperatorWallet
                    }
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value.includes(".")) {
                        const [integerPart, decimalPart] = value.split(".");
                        value = `${integerPart}.${decimalPart.slice(0, 2)}`;
                      }
                      handleVaultChange(
                        index,
                        "distribution",
                        parseFloat(value),
                      );
                    }}
                    placeholder="Distribution"
                    outerClassName="w-fit h-[42px]"
                    className={cn(
                      "h-[42px] w-32 text-right xl:w-48",
                      vault.distribution > 100 && "text-destructive-foreground",
                    )}
                    onKeyDown={(e) =>
                      (e.key === "-" || e.key === "e" || e.key === "E") &&
                      e.preventDefault()
                    }
                    maxLength={3}
                    min={0}
                    max={100}
                    endAdornment={
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 transform">
                        %
                      </span>
                    }
                  />
                </div>
                <Button
                  className="mt-7 flex border border-border p-2 font-semibold text-foreground"
                  size={"sm"}
                  variant={"outline"}
                  onClick={() => handleDeleteVault(index)}
                  disabled={
                    vaults.length === 1 ||
                    isQueuedRewardAllocation ||
                    isQueuedOperatorWallet
                  }
                >
                  <Icons.close className="h-6 w-6" />
                </Button>
              </div>
            ))}
            <div className="my-2 w-full border-t border-border" />
            <div className="flex justify-between">
              <Button
                className="flex border border-border p-2 font-semibold text-foreground"
                size={"sm"}
                disabled={
                  vaults.length >= 10 ||
                  isQueuedRewardAllocation ||
                  isQueuedOperatorWallet
                }
                variant={"outline"}
                onClick={handleAddVault}
              >
                {<Icons.plusCircle className="mr-2 h-4 w-4" />}
                Add Reward Vault
              </Button>
              <Button
                className="flex w-12 border border-border p-2 font-semibold text-foreground"
                size={"sm"}
                variant={"outline"}
                title="Distribute Vaults"
                disabled={isQueuedRewardAllocation || isQueuedOperatorWallet}
                onClick={handleDistributeVaults}
              >
                {<Icons.squareEqual className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {/* Vaults Weight Chart */}
          <div className="ml-8 flex w-[300px] flex-shrink-0 flex-col gap-4 self-center ">
            <div className="flex flex-col gap-4 self-center">
              Current Vaults Weight
            </div>
            <div className="relative z-10 mx-auto h-[200px] w-[200px]">
              <BeraChart
                className="z-10"
                data={pieChartData}
                options={pieChartOptions}
                type="doughnut"
              />
            </div>
            <div className="absolute z-0 mt-28 w-[300px] transform text-center">
              <div className="text-xs font-medium uppercase leading-5 tracking-wide text-muted-foreground">
                Total
              </div>
              <div className="text-lg font-bold leading-6">
                {totalDistribution}%
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-center text-center">
              <span>Total Distribution: {totalDistribution}% </span>
              {error && <span className="ml-2 text-red-500">{error}</span>}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex w-full justify-between border-t border-border pt-6">
        {isQueuedOperatorWallet ? (
          <span className="mr-2 text-sm text-muted-foreground">
            Unable to be modified as the current queued operator
          </span>
        ) : isQueuedRewardAllocation ? (
          <span className="mr-2 text-sm text-muted-foreground">
            Unable to be modified when there is a current queued reward
            allocation
          </span>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto mr-2 flex min-w-36 border-border px-4 py-2"
          disabled={isQueuedRewardAllocation || isQueuedOperatorWallet}
          onClick={handleResetToDefault}
        >
          Reset to Default
        </Button>
        <Button
          size="sm"
          className="flex px-4 py-2"
          disabled={
            !!error ||
            isQueuedRewardAllocation ||
            isApplyingQueuedRewardAllocation ||
            isQueuedOperatorWallet
          }
          onClick={handleQueue}
        >
          Queue
        </Button>
      </CardFooter>
    </Card>
  );
};

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  balancerComposableStablePoolFactoryV6,
  balancerPoolCreationHelperAbi,
  useBeraJs,
  useCreatePool,
  useLiquidityMismatch,
  useSubgraphTokenInformations,
  wBeraToken,
  wrapNativeToken,
  wrapNativeTokens,
  type Token,
  type TokenInput as TokenInputType,
} from "@bera/berajs";
import {
  balancerDelegatedOwnershipAddress,
  balancerVaultAddress,
} from "@bera/config";
import {
  ActionButton,
  FadeSlides,
  TokenInput,
  useAnalytics,
  useTxn,
} from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { Button } from "@bera/ui/button";
import { Icons } from "@bera/ui/icons";
import { InputWithLabel } from "@bera/ui/input";
import { Separator } from "@bera/ui/separator";
import { beraToken } from "@bera/wagmi";
import {
  PoolType,
  ZERO_ADDRESS,
  vaultV2Abi,
  weightedPoolFactoryV4Abi_V2,
} from "@berachain-foundation/berancer-sdk";
import { Address, decodeEventLog, isAddress, zeroAddress } from "viem";
import { usePublicClient } from "wagmi";

import { isBera, isBeratoken } from "~/utils/isBeraToken";
import BeraTooltip from "~/components/bera-tooltip";
import { usePoolWeights } from "~/b-sdk/usePoolWeights";
import useMultipleTokenApprovalsWithSlippage from "~/hooks/useMultipleTokenApprovalsWithSlippage";
import CreatePoolInput from "../components/create-pool-input";
import DynamicPoolCreationPreview from "../components/dynamic-pool-create-preview";
import ParametersInput, { OwnershipType } from "../components/parameters-input";
import PoolCreationSummary from "../components/pool-creation-summary";
import PoolTypeSelector from "../components/pool-type-selector";
import ProcessSteps from "../components/process-steps";
import { getPoolUrl } from "../fetchPools";

const emptyTokenInput: TokenInputType = {
  address: "" as `0x${string}`,
  amount: "0",
  decimals: 18,
  exceeding: false,
  name: "",
  symbol: "",
};
const emptyToken: Token = {
  address: "" as `0x${string}`,
  decimals: 18,
  name: "",
  symbol: "",
};

export enum ParameterPreset {
  USDBACKED = "USD-Backed Stablecoin",
  ALGORITHMIC = "Algorithmic Stablecoin",
}

// FIXME docstrings here.
const DEFAULT_USD_BACKED_AMPLIFICATION = 2500;
const DEFAULT_ALGORITHMIC_AMPLIFICATION = 200;
const DEFAULT_SWAP_FEE = 0.1;
const DEFAULT_POOL_TYPE = PoolType.ComposableStable;
const DEFAULT_AMPLIFICATION = DEFAULT_USD_BACKED_AMPLIFICATION;
const DEFAULT_OWNER = ZERO_ADDRESS;
const DEFAULT_OWNERSHIP_TYPE = OwnershipType.Fixed;
const DEFAULT_TOKENS = [emptyToken, emptyToken];
const DEFAULT_LIQUIDITY = [emptyTokenInput, emptyTokenInput];
const DEFAULT_WEIGHTS = [500000000000000000n, 500000000000000000n];
const DEFAULT_PARAMETER_PRESET = ParameterPreset.USDBACKED;
const LAST_FORM_STEP_NUM = 4; // FIXME enum?

export default function CreatePageContent() {
  const router = useRouter();
  const { captureException, track } = useAnalytics();
  const { account } = useBeraJs();
  const publicClient = usePublicClient();

  // States for Pool Creation and Initial Liquidity
  const [poolCreateTokens, setpoolCreateTokens] =
    useState<Token[]>(DEFAULT_TOKENS);
  const [initialLiquidityTokens, setInitialLiquidityTokens] =
    useState<TokenInputType[]>(DEFAULT_LIQUIDITY);

  const [poolType, setPoolType] = useState<PoolType>(DEFAULT_POOL_TYPE);
  const [swapFee, setSwapFee] = useState<number>(DEFAULT_SWAP_FEE);
  const [poolName, setPoolName] = useState<string>("");
  const [poolSymbol, setPoolSymbol] = useState<string>("");
  const [amplification, setAmplification] = useState<number>(
    DEFAULT_AMPLIFICATION,
  ); // NOTE: min is 1 max is 5000
  const [owner, setOwner] = useState<Address>(DEFAULT_OWNER);
  const [ownershipType, setOwnerShipType] = useState<OwnershipType>(
    DEFAULT_OWNERSHIP_TYPE,
  );
  const [invalidAddressErrorMessage, setInvalidAddressErrorMessage] = useState<
    string | null
  >(null);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);
  const [parameterPreset, setParameterPreset] = useState<ParameterPreset>(
    DEFAULT_PARAMETER_PRESET,
  );

  const { data: tokenPrices, isLoading: isLoadingTokenPrices } =
    useSubgraphTokenInformations({
      tokenAddresses: poolCreateTokens
        .map((token) => token.address)
        .concat(initialLiquidityTokens.map((token) => token.address)),
    });

  async function getPoolIdFromTx(txHash: `0x${string}`) {
    const receipt = await publicClient?.waitForTransactionReceipt({
      hash: txHash,
    });

    try {
      const decodedLogs = receipt?.logs.map((log) => {
        try {
          return decodeEventLog({
            abi: [
              ...balancerPoolCreationHelperAbi,
              ...vaultV2Abi,
              ...(poolType === PoolType.Weighted
                ? weightedPoolFactoryV4Abi_V2
                : balancerComposableStablePoolFactoryV6),
            ],
            ...log,
            strict: false,
          });
        } catch (error) {
          return null;
        }
      });

      const event = decodedLogs?.find(
        (decodedLog) => decodedLog?.eventName === "PoolRegistered",
      );

      if (!event || event.eventName !== "PoolRegistered") {
        return null;
      }

      return event.args.poolId ?? null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  const handleOwnershipTypeChange = (type: OwnershipType) => {
    setOwnerShipType(type);
    setOwner(
      type === OwnershipType.Governance
        ? balancerDelegatedOwnershipAddress
        : type === OwnershipType.Fixed
          ? ZERO_ADDRESS
          : account || zeroAddress,
    );
  };

  // NOTE: this is effectively only used for stable pools since weighted ones don't support this parameter.
  const handleParameterPresetChange = (type: ParameterPreset) => {
    setParameterPreset(type);
    setAmplification(
      type === ParameterPreset.USDBACKED
        ? DEFAULT_USD_BACKED_AMPLIFICATION
        : type === ParameterPreset.ALGORITHMIC
          ? DEFAULT_ALGORITHMIC_AMPLIFICATION
          : 1,
    );
  };

  const handleOwnerChange = (address: Address) => {
    setOwner(address);
    setInvalidAddressErrorMessage(
      isAddress(address) ? null : "Invalid custom address",
    );
  };

  // handle max/min tokens per https://docs.balancer.fi/concepts/pools/more/configuration.html
  const minTokensLength = 2; // i.e. for meta/stable/weighted it's 2
  const maxTokensLength = poolType === PoolType.Weighted ? 8 : 5; // i.e. for meta/stable it's 5

  // check for token approvals
  const { needsApproval: tokensNeedApproval, refresh: refreshAllowances } =
    useMultipleTokenApprovalsWithSlippage(
      initialLiquidityTokens,
      balancerVaultAddress,
    );

  const {
    weights,
    resetWeights,
    lockedWeights,
    weightsError,
    handleWeightChange,
    toggleLock,
    addWeight,
    removeWeight,
  } = usePoolWeights(DEFAULT_WEIGHTS);

  const handleAddToken = () => {
    if (poolCreateTokens.length < maxTokensLength) {
      setpoolCreateTokens((prevTokens) => [...prevTokens, emptyToken]);
      setInitialLiquidityTokens((prevTokens) => [
        ...prevTokens,
        emptyTokenInput,
      ]);
      addWeight();
    }
  };

  const handleRemoveToken = (index: number) => {
    if (poolCreateTokens.length > minTokensLength) {
      setpoolCreateTokens((prevTokens) =>
        prevTokens.filter((_, i) => i !== index),
      );
      setInitialLiquidityTokens((prevTokens) =>
        prevTokens.filter((_, i) => i !== index),
      );
      removeWeight(index);
    }
  };

  // Handle create pool token changes
  const handlePoolTokenChange = (index: number, newToken: Token): void => {
    setpoolCreateTokens((prevTokens) => {
      const updatedTokens = [...prevTokens];
      updatedTokens[index] = { ...updatedTokens[index], ...newToken };
      return updatedTokens;
    });
    setInitialLiquidityTokens((prevTokens) => {
      const updatedTokens = [...prevTokens];
      if (!updatedTokens[index]) {
        updatedTokens[index] = { ...emptyTokenInput, ...newToken };
      } else {
        updatedTokens[index] = { ...updatedTokens[index], ...newToken };
      }
      return updatedTokens;
    });
  };

  const handleAddLiquidityTokenChange = (
    index: number,
    updates: Partial<TokenInputType>,
  ): void => {
    setInitialLiquidityTokens((prevTokens) => {
      const updatedTokens = [...prevTokens];
      updatedTokens[index] = {
        ...updatedTokens[index], // Preserve existing properties
        ...updates, // Apply partial updates
      };
      return updatedTokens;
    });
  };

  // Initialize useCreatePool hook to get pool setup data and arguments for creating pool
  const {
    generatedPoolName,
    generatedPoolSymbol,
    isDupePool,
    dupePool,
    createPoolArgs,
  } = useCreatePool({
    poolCreateTokens,
    initialLiquidityTokens,
    normalizedWeights: weights,
    poolType,
    swapFee,
    poolName,
    poolSymbol,
    owner,
    amplification,
  });

  // Synchronize the generated pool name and symbol with state
  useEffect(() => {
    setPoolName(generatedPoolName);
    setPoolSymbol(generatedPoolSymbol);
  }, [generatedPoolName, generatedPoolSymbol]);

  // Create the pool with UX feedback
  const [createPoolErrorMessage, setCreatePoolErrorMessage] =
    useState<string>("");
  const [poolId, setPoolId] = useState<string>("");
  const {
    write: writeCreatePool,
    ModalPortal,
    isLoading: isLoadingCreatePoolTx,
    isSubmitting: isSubmittingCreatePoolTx,
    isSuccess: isSuccessCreatePoolTx,
    reset: resetCreatePoolTx,
  } = useTxn({
    message: `Create pool ${poolName}`,
    onSuccess: async (txHash) => {
      track("create_pool_success");
      const poolId = await getPoolIdFromTx(txHash as `0x${string}`);
      if (poolId) {
        setPoolId(poolId);
      }
    },
    onError: (e) => {
      track("create_pool_failed");
      captureException(new Error("Create pool failed"), {
        data: { rawError: e },
      });
      setCreatePoolErrorMessage(`Error creating pool: ${e?.message}`);
    },
  });

  useEffect(() => {
    if (!isPreviewOpen) {
      // Reset create tx error message if you close/reopen the preview
      setCreatePoolErrorMessage("");
    }
    if (!isPreviewOpen && isSuccessCreatePoolTx) {
      // Reset the pool creation page state so you can create another pool without refreshing the page (if the tx was a success)
      setpoolCreateTokens(DEFAULT_TOKENS);
      setInitialLiquidityTokens(DEFAULT_LIQUIDITY);
      setPoolType(DEFAULT_POOL_TYPE);
      setSwapFee(DEFAULT_SWAP_FEE);
      setPoolName("");
      setPoolSymbol("");
      setAmplification(DEFAULT_AMPLIFICATION);
      setOwner(DEFAULT_OWNER);
      setOwnerShipType(DEFAULT_OWNERSHIP_TYPE);
      setInvalidAddressErrorMessage(null);
      setPoolId("");
      resetWeights(DEFAULT_WEIGHTS);
      resetCreatePoolTx();
    }
  }, [isPreviewOpen, isSuccessCreatePoolTx]);

  // Determine if there are any liquidity mismatches in the pool (supply imbalances in terms of pool weights)
  const liquidityMismatchInfo = useLiquidityMismatch({
    tokenPrices,
    isLoadingTokenPrices,
    tokens: initialLiquidityTokens,
    weights,
    weightsError,
    poolType,
  });

  const isNextButtonDisabled = (): boolean => {
    switch (currentStep) {
      // Pool type
      case 0:
        return false;
      // Select tokens
      case 1:
        if (
          poolCreateTokens.some((token) => token.address.length === 0) ||
          (poolType === PoolType.Weighted &&
            weights.some((weight) => weight === 0n))
        ) {
          return true;
        }
        return false;
      // Deposit liquidity
      case 2:
        if (
          initialLiquidityTokens.some(
            (token) =>
              !token.amount ||
              Number(token.amount) <= 0 ||
              token.amount === "" ||
              token.exceeding,
          ) ||
          poolCreateTokens.length !== initialLiquidityTokens.length // NOTE: this should never be possible.
        ) {
          return true;
        }
        return false;
      // Set parameters
      case 3:
        return (
          !owner ||
          (ownershipType === OwnershipType.Custom && !isAddress(owner)) ||
          (poolType === PoolType.ComposableStable && !amplification)
        );
      // Set info
      case 4:
        return !poolName || !poolSymbol;
      default:
        return false;
    }
  };

  useEffect(() => {
    setNextButtonDisabled(isNextButtonDisabled());
  }, [
    poolCreateTokens,
    poolName,
    poolSymbol,
    owner,
    ownershipType,
    currentStep,
    initialLiquidityTokens,
  ]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      {ModalPortal}
      <Button
        variant={"ghost"}
        size="sm"
        className="flex items-center gap-1 self-start"
        onClick={() => router.push("/pools")}
      >
        <Icons.arrowLeft className="h-4 w-4" />
        <div className="text-sm font-medium">Back to Pools</div>
      </Button>
      <h2 className="self-start text-3xl font-semibold">Create a Pool</h2>
      <div className="flex w-full flex-row justify-center gap-12">
        <ProcessSteps
          titles={[
            "Pool Type",
            "Select Tokens",
            "Deposit Liquidity",
            "Set Parameters",
            "Set Info",
          ]}
          selectedStep={currentStep}
          completedSteps={completedSteps}
          setCurrentStep={setCurrentStep}
          currentStep={currentStep}
        />

        <div className="flex w-full flex-col">
          {currentStep === 0 && (
            <PoolTypeSelector
              poolType={poolType}
              onPoolTypeChange={setPoolType}
            />
          )}
          {currentStep === 1 && (
            <section className="flex w-full flex-col gap-4">
              <h2 className="self-start text-3xl font-semibold">{`Select Tokens ${
                poolType === PoolType.Weighted ? "& Weighting" : ""
              }`}</h2>
              <div className="flex w-full flex-col gap-2">
                {poolCreateTokens.map((token, index) => (
                  <CreatePoolInput
                    // NOTE: WBERA and BERA are mutually exclusive options, we wrap BERA -> WBERA in poolCreationHelper
                    key={`token-${index}`}
                    token={token}
                    selectedTokens={poolCreateTokens}
                    weight={weights[index]}
                    displayWeight={poolType === PoolType.Weighted}
                    locked={lockedWeights[index]}
                    displayRemove={poolCreateTokens.length > minTokensLength}
                    index={index}
                    onTokenSelection={(selectedToken) => {
                      if (selectedToken) {
                        // FIXME: how is this needing to be handled??
                        handlePoolTokenChange(index, selectedToken);
                      }
                    }}
                    onWeightChange={handleWeightChange}
                    onLockToggle={toggleLock}
                    onRemoveToken={handleRemoveToken}
                  />
                ))}
              </div>

              {poolCreateTokens.length < maxTokensLength && (
                <>
                  <Separator className="text-muted-foreground opacity-50" />
                  <div className="mr-auto -translate-x-4">
                    <Button
                      onClick={handleAddToken}
                      variant="ghost"
                      className="text-foreground"
                    >
                      <Icons.plusCircle className="h-6 w-6" />
                      <p className="pl-2"> Add Token</p>
                    </Button>
                  </div>
                </>
              )}
              {weightsError && (
                <Alert variant="destructive" className="my-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{weightsError}</AlertDescription>
                </Alert>
              )}

              {isDupePool && dupePool && (
                <Alert variant="destructive">
                  <AlertTitle>Similar Pool Exists</AlertTitle>
                  <AlertDescription className="space-y-4">
                    <p>
                      {`Please note that a ${poolType} pool with the same tokens 
                exists, consider adding liquidity instead of creating a new pool:`}
                    </p>
                    <a
                      href={getPoolUrl(dupePool)}
                      className="text-sky-600 underline"
                    >
                      Existing pool
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </section>
          )}
          {currentStep === 2 && (
            <section className="flex w-full flex-col gap-4">
              <h2 className="self-start text-3xl font-semibold">
                Set Initial Liquidity
              </h2>
              <div className="flex flex-col gap-4">
                <ul className="divide-y divide-border rounded-lg border">
                  {initialLiquidityTokens.map((token, index) => (
                    // NOTE: prices for BERA (wrapped create) must be given in WBERA as that is the wrapped token's value.
                    <TokenInput
                      key={`liq-${index}`}
                      selected={token}
                      amount={token.amount}
                      isActionLoading={isLoadingTokenPrices}
                      customTokenList={
                        isBera(token) || isBeratoken(token)
                          ? [wBeraToken, beraToken]
                          : undefined
                      }
                      price={Number(
                        tokenPrices?.[wrapNativeToken(token)?.address] ?? 0,
                      )} // TODO (#): this would make more sense as token.usdValue
                      hidePrice={
                        !tokenPrices?.[wrapNativeToken(token)?.address]
                      }
                      disabled={false}
                      setAmount={(amount) =>
                        handleAddLiquidityTokenChange(index, { amount })
                      }
                      onExceeding={(isExceeding) =>
                        handleAddLiquidityTokenChange(index, {
                          exceeding: isExceeding,
                        })
                      }
                      onTokenSelection={(selectedToken) => {
                        // NOTE: this is specifically used for if the user wants to select BERA or WBERA
                        selectedToken &&
                          handleAddLiquidityTokenChange(index, selectedToken);
                      }}
                      showExceeding
                      selectable={isBera(token) || isBeratoken(token)}
                      forceShowBalance={true}
                      hideMax={false}
                      className={cn(
                        "w-full grow border-0 bg-transparent pr-4 text-right text-2xl font-semibold outline-none",
                        token.exceeding && "text-destructive-foreground",
                      )}
                    />
                  ))}
                </ul>
                {!weightsError && liquidityMismatchInfo.message && (
                  <Alert variant="warning" className="my-4">
                    <AlertTitle>{liquidityMismatchInfo.title}</AlertTitle>
                    <AlertDescription>
                      {liquidityMismatchInfo.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </section>
          )}
          {currentStep === 3 && (
            <ParametersInput
              amplification={amplification}
              onAmplificationChange={setAmplification}
              parameterPreset={parameterPreset}
              onChangeParameterPresetType={handleParameterPresetChange}
              ownershipType={ownershipType}
              owner={owner}
              onChangeOwnershipType={handleOwnershipTypeChange}
              onOwnerChange={handleOwnerChange}
              invalidAddressErrorMessage={invalidAddressErrorMessage}
              swapFee={swapFee}
              onSwapFeeChange={setSwapFee}
              poolType={poolType}
            />
          )}
          {currentStep === 4 && (
            <section className="flex w-full flex-col gap-4">
              <InputWithLabel
                label="Pool Name"
                variant="black"
                className="bg-transparent"
                value={poolName}
                maxLength={85}
                onChange={(e) => {
                  setPoolName(e.target.value);
                }}
              />

              <InputWithLabel
                label="Pool Symbol"
                variant="black"
                className="bg-transparent"
                value={poolSymbol}
                maxLength={85}
                onChange={(e) => {
                  setPoolSymbol(e.target.value.replace(" ", "-"));
                }}
              />
            </section>
          )}
          {/* {currentStep === 5 && (  TODO: instead of using dynamic preview we do the tx as a step.
            <section>
              <Button>View Pool</Button>
              <Button>Back to all Pools</Button>
            </section>
          )} */}
          <ActionButton className="w-fit self-end pt-4">
            <Button
              onClick={() => {
                if (currentStep === LAST_FORM_STEP_NUM) {
                  setPreviewOpen(true);
                } else {
                  setCurrentStep(currentStep + 1);
                  setCompletedSteps([...completedSteps, currentStep]);
                }
              }}
              disabled={nextButtonDisabled}
              className={cn(
                "mt-6 self-end",
                nextButtonDisabled
                  ? "cursor-not-allowed opacity-50"
                  : "opacity-100",
                currentStep === LAST_FORM_STEP_NUM && "bg-[#e6b434]", // FIXME custom colour
              )}
            >
              {currentStep === LAST_FORM_STEP_NUM ? "Create Pool" : "Next"}
            </Button>
          </ActionButton>
        </div>

        <PoolCreationSummary
          poolType={poolType}
          tokens={initialLiquidityTokens}
          tokenPrices={tokenPrices}
          swapFee={swapFee}
          ownersAddress={owner}
          name={poolName}
          symbol={poolSymbol}
        />
        <DynamicPoolCreationPreview
          open={isPreviewOpen}
          setOpen={setPreviewOpen}
          poolCreateTokens={poolCreateTokens}
          initialLiquidityTokens={initialLiquidityTokens}
          tokenPrices={tokenPrices} // TODO (BFE-409): we should bundle TokenInput and Price properly as token.usdValue
          weights={weights}
          poolName={poolName}
          poolSymbol={poolSymbol}
          poolType={poolType}
          poolId={poolId}
          swapFee={swapFee}
          ownerAddress={owner}
          ownershipType={ownershipType}
          amplification={amplification}
          isLoadingCreatePoolTx={isLoadingCreatePoolTx}
          isSubmittingCreatePoolTx={isSubmittingCreatePoolTx}
          writeCreatePool={() => {
            console.log("createPoolArgs", createPoolArgs);
            writeCreatePool(createPoolArgs);
          }}
          isSuccessCreatePoolTx={isSuccessCreatePoolTx}
          createPoolErrorMessage={createPoolErrorMessage}
          tokensNeedApproval={tokensNeedApproval}
          refreshAllowances={refreshAllowances}
        />
      </div>
    </div>
  );
}

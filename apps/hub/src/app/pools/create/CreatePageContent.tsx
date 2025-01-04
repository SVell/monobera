"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Oracle,
  OracleMode,
  PoolCreationStep,
  balancerComposableStablePoolFactoryV6,
  balancerPoolCreationHelperAbi,
  useBeraJs,
  useCreatePool,
  useLiquidityMismatch,
  useSubgraphTokenInformations,
  useTokenCurrentPrices,
  wBeraToken,
  wrapNativeToken,
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

import {
  DEFAULT_ALGORITHMIC_AMPLIFICATION,
  DEFAULT_AMPLIFICATION,
  DEFAULT_LIQUIDITY,
  DEFAULT_ORACLES,
  DEFAULT_OWNER,
  DEFAULT_OWNERSHIP_TYPE,
  DEFAULT_PARAMETER_PRESET,
  DEFAULT_POOL_TYPE,
  DEFAULT_TOKENS,
  DEFAULT_USD_BACKED_AMPLIFICATION,
  DEFAULT_WEIGHTS,
  POOL_CREATION_STEPS,
  ParameterPreset,
  emptyOracle,
  emptyToken,
  emptyTokenInput,
} from "~/utils/constants";
import { isBera, isBeratoken } from "~/utils/isBeraToken";
import { usePoolWeights } from "~/b-sdk/usePoolWeights";
import useMultipleTokenApprovalsWithSlippage from "~/hooks/useMultipleTokenApprovalsWithSlippage";
import CreatePoolInput from "../components/create-pool-input";
import DynamicPoolCreationPreview from "../components/dynamic-pool-create-preview";
import OracleInput from "../components/oracle-input";
import ParametersInput, { OwnershipType } from "../components/parameters-input";
import PoolCreationSummary from "../components/pool-creation-summary";
import PoolTypeSelector from "../components/pool-type-selector";
import ProcessSteps, { VerifiedSteps } from "../components/process-steps";
import { getPoolUrl } from "../fetchPools";
import { getStepVerification } from "../getStepVerification";

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
  const [poolName, setPoolName] = useState<string>("");
  const [poolSymbol, setPoolSymbol] = useState<string>("");
  const [amplification, setAmplification] = useState<number>(
    DEFAULT_AMPLIFICATION,
  ); // NOTE: min is 1 max is 5000
  const [amplificationInvalid, setAmplificationInvalid] =
    useState<boolean>(false);
  const [owner, setOwner] = useState<Address>(DEFAULT_OWNER);
  const [ownershipType, setOwnerShipType] = useState<OwnershipType>(
    DEFAULT_OWNERSHIP_TYPE,
  );
  const [invalidAddressErrorMessage, setInvalidAddressErrorMessage] = useState<
    string | null
  >(null);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(PoolCreationStep.POOL_TYPE);
  const [completedSteps, setCompletedSteps] = useState<PoolCreationStep[]>([]);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);
  const [parameterPreset, setParameterPreset] = useState<ParameterPreset>(
    DEFAULT_PARAMETER_PRESET,
  );
  const [oracles, setOracles] = useState<Oracle[]>(DEFAULT_ORACLES);
  const isLastStep =
    currentStep === POOL_CREATION_STEPS[POOL_CREATION_STEPS.length - 1];

  const { data: bexTokenPrices, isLoading: isLoadingBexTokenPrices } =
    useTokenCurrentPrices();

  const predefinedFees =
    poolType === PoolType.ComposableStable ? [0.01, 0.05, 0.1] : [0.3, 0.5, 1];
  const initialFee = poolType === PoolType.ComposableStable ? 0.01 : 0.3;
  const [swapFeeIsInvalid, setSwapFeeIsInvalid] = useState<boolean>(false);
  const [swapFee, setSwapFee] = useState<number>(initialFee);

  useEffect(() => {
    setSwapFee(initialFee);
  }, [poolType]);

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

      // @ts-ignore
      return event.args.poolId ?? null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  const onOracleChange = (index: number, updates: Partial<Oracle>) => {
    setOracles((prevOracles) => {
      const updatedOracles = [...prevOracles];
      updatedOracles[index] = { ...prevOracles[index], ...updates };
      return updatedOracles;
    });
  };

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
  const maxTokensLength = poolType === PoolType.Weighted ? 2 : 5; // NOTE: yes weighted supports more but this is what UI will support for now.

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
      setOracles((prevOracles) => [...prevOracles, emptyOracle]);
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
      setOracles((prevOracles) => prevOracles.filter((_, i) => i !== index));
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

  // Handle the quantity of tokens (limit) if we are swapping between the types
  useEffect(() => {
    if (poolCreateTokens.length > maxTokensLength) {
      setpoolCreateTokens((prevTokens) => prevTokens.slice(0, maxTokensLength));
      setInitialLiquidityTokens((prevTokens) =>
        prevTokens.slice(0, maxTokensLength),
      );
      setOracles((prevOracles) => prevOracles.slice(0, maxTokensLength));
      resetWeights(weights.slice(0, maxTokensLength));
    }
  }, [poolType, maxTokensLength]);

  const handleAddLiquidityTokenChange = (
    index: number,
    updates: Partial<TokenInputType>,
  ): void => {
    setInitialLiquidityTokens((prevTokens) => {
      const updatedTokens = [...prevTokens];
      updatedTokens[index] = {
        ...updatedTokens[index],
        ...updates,
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
    oracles,
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
      track("create_pool_success", {
        poolName: poolName,
        poolSymbol: poolSymbol,
      });
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
      setSwapFee(initialFee);
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
    currentStep,
    tokenPrices: bexTokenPrices,
    isLoadingTokenPrices: isLoadingBexTokenPrices,
    tokens: initialLiquidityTokens,
    weights,
    weightsError,
    poolType,
    oracles,
  });

  const [verifiedSteps, setVerifiedSteps] = useState<
    ReturnType<typeof getStepVerification>
  >(
    getStepVerification(
      poolCreateTokens,
      initialLiquidityTokens,
      poolType,
      weights,
      oracles,
      OracleMode,
      owner,
      ownershipType,
      swapFeeIsInvalid,
      amplificationInvalid,
      amplification,
      poolName,
      poolSymbol,
    ),
  );

  const isVerificationFailure = Object.values(verifiedSteps.steps).some(
    (step) => !step,
  );
  const [finalStepErrorMessage, setFinalStepErrorMessage] = useState<
    string | null
  >(null);

  // TODO: we might move this into a custom use-hook
  useEffect(() => {
    const verifiedSteps = getStepVerification(
      poolCreateTokens,
      initialLiquidityTokens,
      poolType,
      weights,
      oracles,
      OracleMode,
      owner,
      ownershipType,
      swapFeeIsInvalid,
      amplificationInvalid,
      amplification,
      poolName,
      poolSymbol,
    );
    setNextButtonDisabled(!verifiedSteps.steps[currentStep]);
    setVerifiedSteps(verifiedSteps);
    setFinalStepErrorMessage(
      Object.values(verifiedSteps.errors)
        .filter((error) => error !== null)
        .map((error) => `• ${error}`)
        .join("\n") || null,
    );
  }, [
    poolType,
    poolCreateTokens,
    poolName,
    poolSymbol,
    owner,
    weights,
    ownershipType,
    currentStep,
    initialLiquidityTokens,
    oracles,
  ]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      {ModalPortal}
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
      <div className="flex w-full flex-col justify-center xl:flex-row">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <ProcessSteps
            stepEnum={PoolCreationStep}
            className="xl:col-span-2"
            selectedStep={currentStep}
            completedSteps={completedSteps}
            setCurrentStep={setCurrentStep}
            verifiedSteps={verifiedSteps}
          />
          <div className="flex w-full flex-col xl:col-span-6">
            {currentStep === PoolCreationStep.POOL_TYPE && (
              <PoolTypeSelector
                poolType={poolType}
                onPoolTypeChange={setPoolType}
              />
            )}
            {currentStep === PoolCreationStep.SELECT_TOKENS && (
              <section className="flex w-full flex-col gap-4">
                <h2 className="self-start text-xl font-semibold">{`Select Tokens ${
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
                          handlePoolTokenChange(index, selectedToken);
                        }
                      }}
                      onWeightChange={handleWeightChange}
                      onOracleChange={onOracleChange}
                      onLockToggle={toggleLock}
                      onRemoveToken={handleRemoveToken}
                      poolType={poolType}
                      oracle={oracles[index]}
                    />
                  ))}
                  {
                    <div className="flex w-full flex-col gap-6 pt-4">
                      {poolType === PoolType.ComposableStable &&
                        oracles.map(
                          (oracle, index) =>
                            oracle.mode === OracleMode.Custom &&
                            poolCreateTokens[index].symbol && (
                              <OracleInput
                                key={`oracle-${index}`}
                                oracle={oracle}
                                token={poolCreateTokens[index]}
                                index={index}
                                onOracleChange={onOracleChange}
                              />
                            ),
                        )}
                    </div>
                  }
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
            {currentStep === PoolCreationStep.DEPOSIT_LIQUIDITY && (
              <section className="flex w-full flex-col gap-4">
                <h2 className="self-start text-xl font-semibold">
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
                        )} // TODO (BFE-409): this would make more sense as token.usdValue
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
                </div>
              </section>
            )}
            {currentStep === PoolCreationStep.SET_PARAMETERS && (
              <ParametersInput
                amplification={amplification}
                onAmplificationChange={setAmplification}
                onInvalidAmplification={setAmplificationInvalid}
                parameterPreset={parameterPreset}
                onChangeParameterPresetType={handleParameterPresetChange}
                ownershipType={ownershipType}
                owner={owner}
                onChangeOwnershipType={handleOwnershipTypeChange}
                onOwnerChange={handleOwnerChange}
                invalidAddressErrorMessage={invalidAddressErrorMessage}
                onSwapFeeChange={setSwapFee}
                poolType={poolType}
                swapFee={swapFee}
                onInvalidSwapFee={setSwapFeeIsInvalid}
                predefinedFees={predefinedFees}
              />
            )}
            {currentStep === PoolCreationStep.SET_INFO && (
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
            {/* {currentStep === 5 && (  // TODO (#BFE-410): instead of using dynamic preview we do the tx & success as a step.
            <section>
              <Button>View Pool</Button>
              <Button>Back to all Pools</Button>
            </section>
          )} */}

            {liquidityMismatchInfo.message &&
              (currentStep === PoolCreationStep.SELECT_TOKENS ||
                currentStep === PoolCreationStep.DEPOSIT_LIQUIDITY) && (
                <Alert
                  variant="warning"
                  className={cn(
                    "my-4",
                    liquidityMismatchInfo.suggestWeighted && "cursor-pointer",
                  )}
                  onClick={() => {
                    if (liquidityMismatchInfo.suggestWeighted) {
                      setCurrentStep(PoolCreationStep.POOL_TYPE);
                      // setPoolType(PoolType.Weighted);
                    }
                  }}
                >
                  <AlertTitle>{liquidityMismatchInfo.title}</AlertTitle>
                  <AlertDescription>
                    {liquidityMismatchInfo.message}
                  </AlertDescription>
                </Alert>
              )}

            {isLastStep && isVerificationFailure && (
              <div className="pt-4">
                <Alert variant="destructive">
                  <AlertTitle>Cannot Create Pool</AlertTitle>
                  <AlertDescription className="whitespace-pre-line">
                    {finalStepErrorMessage}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <ActionButton className="w-32 self-end pt-4">
              <Button
                onClick={() => {
                  if (isLastStep) {
                    setPreviewOpen(true);
                  } else {
                    setCurrentStep(
                      POOL_CREATION_STEPS[
                        POOL_CREATION_STEPS.indexOf(currentStep) + 1
                      ],
                    );
                    setCompletedSteps([...completedSteps, currentStep]);
                  }
                }}
                disabled={
                  isLastStep ? isVerificationFailure : nextButtonDisabled
                }
                className={cn(
                  "w-32 self-end pr-4",
                  nextButtonDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "opacity-100",
                )}
              >
                {isLastStep ? "Create Pool" : "Next"}
              </Button>
            </ActionButton>
          </div>

          <PoolCreationSummary
            className="xl:col-span-4"
            currentStep={currentStep}
            completedSteps={completedSteps}
            poolType={poolType}
            ownershipType={ownershipType}
            tokens={initialLiquidityTokens}
            tokenPrices={tokenPrices}
            swapFee={swapFee}
            ownersAddress={owner}
            name={poolName}
            symbol={poolSymbol}
          />
        </div>
      </div>
    </div>
  );
}

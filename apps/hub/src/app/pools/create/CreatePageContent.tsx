"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Oracle,
  OracleMode,
  balancerComposableStablePoolFactoryV6,
  balancerPoolCreationHelperAbi,
  useBeraJs,
  useCreatePool,
  useLiquidityMismatch,
  useSubgraphTokenInformations,
  useTokens,
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
import OracleInput from "../components/oracle-input";
import ParametersInput, { OwnershipType } from "../components/parameters-input";
import PoolCreationSummary from "../components/pool-creation-summary";
import PoolTypeSelector from "../components/pool-type-selector";
import ProcessSteps, { VerifiedSteps } from "../components/process-steps";
import { getPoolUrl } from "../fetchPools";

export enum ParameterPreset {
  USDBACKED = "USD-Backed Stablecoin",
  ALGORITHMIC = "Algorithmic Stablecoin",
}

/**
 * Default pool amplification factor (responsiveness to price fluctuations) for USD-backed stablecoins.
 * @constant {number}
 */
const DEFAULT_USD_BACKED_AMPLIFICATION = 2500;

/**
 * Default pool amplification factor (responsiveness to price fluctuations) for algorithmic stablecoins.
 * @constant {number}
 */
const DEFAULT_ALGORITHMIC_AMPLIFICATION = 200;

/**
 * Default pool type for pools is a composable stable pool, which can be referred to as a 'stable pool'.
 * @constant {PoolType}
 */
const DEFAULT_POOL_TYPE = PoolType.ComposableStable;

/**
 * Default amplification factor for pools is a higher value for USD-backed stablecoin pools (max 5k).
 * @constant {number}
 */
const DEFAULT_AMPLIFICATION = DEFAULT_USD_BACKED_AMPLIFICATION;

/**
 * Default owner for pools is fixed type, which is the 0x0 address.
 * @constant {Address}
 */
const DEFAULT_OWNER = ZERO_ADDRESS;

/**
 * Default ownership type for pools is Fixed which yields the 0x0 owner address.
 * @constant {OwnershipType}
 */
const DEFAULT_OWNERSHIP_TYPE = OwnershipType.Fixed;

/**
 * Default weights for pools is an event split since we default to two tokens.
 * @constant {bigint[]}
 */
const DEFAULT_WEIGHTS = [500000000000000000n, 500000000000000000n];

/**
 * Default parameter preset for pools is USD-backed stablecoin preset.
 * @constant {ParameterPreset}
 */
const DEFAULT_PARAMETER_PRESET = ParameterPreset.USDBACKED;

/**
 * Last form step number.
 * @constant {number}
 */
const LAST_FORM_STEP_NUM = 4; // NOTE: in the future we might consider making this more dynamic/strongly typed via enums.

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

/**
 * Default tokens for pools is two empty tokens.
 * NOTE: if in the future we streamline the token selection process, we might consider tying this closer to TokenInputs
 * @constant {Token[]}
 */
const DEFAULT_TOKENS = [emptyToken, emptyToken];

/**
 * Default liquidity for pools is two empty tokens.
 * @constant {TokenInputType[]}
 */
const DEFAULT_LIQUIDITY = [emptyTokenInput, emptyTokenInput];

/**
 * If a rate provider (oracle) is provided, this is the default update interval in seconds (using block.timestamp internally).
 * @constant {number}
 */
const DEFAULT_ORACLE_CACHE_DURATION = 100;

const emptyOracle: Oracle = {
  mode: OracleMode.None,
  address: ZERO_ADDRESS,
  tokenAddress: "",
  cacheDuration: DEFAULT_ORACLE_CACHE_DURATION, // NOTE: even if we dont use an oracle, we pass a safe value for this to pool create
};

/**
 * Default oracles for pools is two empty oracles.
 * @constant {Oracle[]}
 */
const DEFAULT_ORACLES: Oracle[] = [emptyOracle, emptyOracle];

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
  const [oracles, setOracles] = useState<Oracle[]>(DEFAULT_ORACLES);
  const isLastStep = currentStep === LAST_FORM_STEP_NUM;

  // const { data: bexTokenPrices, isLoading: isLoadingBexTokenPrices } =
  //   useTokenCurrentPrices();

  let predefinedFees = [0.3, 0.5, 1];
  let initialFee = 0.3;
  if (
    poolType === PoolType.ComposableStable ||
    poolType === PoolType.MetaStable
  ) {
    predefinedFees = [0.01, 0.05, 0.1];
    initialFee = 0.01;
  }
  const [swapFee, setSwapFee] = useState<number>(initialFee);

  useEffect(() => {
    const tokenList = tokens?.tokenList ?? [];

    if (poolType !== "ComposableStable") {
      setStablePoolWithNonStableTokensWarning(null);
      return;
    }
    if (tokenList.length === 0 || !poolCreateTokens) {
      return;
    }

    const nonStableTokens = poolCreateTokens.filter((token) => {
      if (!token?.address) return false;
      const tokenFromList = tokenList.find(
        (t) => t.address.toLowerCase() === token.address.toLowerCase(),
      );
      return !tokenFromList?.tags?.includes("stablecoin");
    });

    if (nonStableTokens.length > 0) {
      setStablePoolWithNonStableTokensWarning(
        `The following token(s) are not stable: ${nonStableTokens
          .map((t) => t.symbol)
          .join(", ")}. Did you mean to create a weighted pool instead?`,
      );
    } else {
      setStablePoolWithNonStableTokensWarning(null);
    }
  }, [tokens?.tokenList, poolCreateTokens, poolType]);

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
    tokenPrices,
    isLoadingTokenPrices,
    tokens: initialLiquidityTokens,
    weights,
    weightsError,
    poolType,
  });

  const getStepVerification = (): {
    steps: boolean[];
    errors: (string | null)[];
  } => {
    const errors: (string | null)[] = Array(5).fill(null); // Initialize errors with null

    const steps = [
      // Step 0: Pool type (always complete, impossible to fail)
      true,

      // Step 1: Select tokens
      (() => {
        const hasEmptyToken = poolCreateTokens.some(
          (token) => token.address.length === 0,
        );
        const hasZeroWeight =
          poolType === PoolType.Weighted &&
          weights.some((weight) => weight === 0n);

        const hasUnsetCustomOracles = oracles.some(
          (oracle) =>
            oracle.mode === OracleMode.Custom && !isAddress(oracle.address),
        );

        if (hasEmptyToken) {
          errors[1] = "All token slots must have a valid token selected.";
          return false;
        }

        if (hasZeroWeight) {
          errors[1] = "Weights must be greater than 0 for Weighted Pools.";
          return false;
        }

        if (hasUnsetCustomOracles) {
          errors[1] =
            "All rate-providing token oracles must have a valid address.";
          return false;
        }

        return true;
      })(),

      // Step 2: Deposit liquidity
      (() => {
        const isValid =
          !initialLiquidityTokens.some(
            (token) =>
              !token.amount ||
              Number(token.amount) <= 0 ||
              token.amount === "" ||
              token.exceeding,
          ) && poolCreateTokens.length === initialLiquidityTokens.length;
        if (!isValid)
          errors[2] = "Ensure all tokens have valid liquidity amounts.";
        return isValid;
      })(),

      // Step 3: Set parameters
      (() => {
        if (!owner) {
          errors[3] = "Owner address is required.";
          return false;
        }

        if (ownershipType === OwnershipType.Custom && !isAddress(owner)) {
          errors[3] = "Custom owner address is invalid.";
          return false;
        }

        if (poolType === PoolType.ComposableStable && !amplification) {
          errors[3] = "Amplification factor is required for stable pools.";
          return false;
        }

        return true;
      })(),

      // Step 4: Set info
      (() => {
        if (!poolName) {
          errors[4] = "Pool name cannot be empty.";
          return false;
        }

        if (!poolSymbol) {
          errors[4] = "Pool symbol cannot be empty.";
          return false;
        }

        return true;
      })(),
    ];

    return { steps, errors };
  };

  const [verifiedSteps, setVerifiedSteps] = useState<VerifiedSteps>(
    getStepVerification(),
  );
  const isVerificationFailure = verifiedSteps.steps.some((step) => !step);
  const [finalStepErrorMessage, setFinalStepErrorMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    const verifiedSteps = getStepVerification();
    setNextButtonDisabled(!verifiedSteps.steps[currentStep]);
    setVerifiedSteps(verifiedSteps);
    setFinalStepErrorMessage(
      verifiedSteps.errors
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
        <div className="flex w-full flex-col gap-12 xl:flex-row">
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
            verifiedSteps={verifiedSteps}
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
            {currentStep === 2 && (
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
                onSwapFeeChange={setSwapFee}
                poolType={poolType}
                swapFee={swapFee}
                predefinedFees={predefinedFees}
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
            {/* {currentStep === 5 && (  // TODO (#BFE-410): instead of using dynamic preview we do the tx & success as a step.
            <section>
              <Button>View Pool</Button>
              <Button>Back to all Pools</Button>
            </section>
          )} */}
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
                    setCurrentStep(currentStep + 1);
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

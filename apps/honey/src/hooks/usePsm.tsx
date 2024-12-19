"use client";

import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import {
  IContractWrite,
  TokenWithAmount,
  TransactionActionType,
  useBeraJs,
  useCollateralWeights,
  useCollateralsRates,
  useHoneyCollaterals,
  useIsBadCollateralAsset,
  useIsBasketModeEnabled,
  usePollBalance,
  usePollHoneyPreview,
  useTokens,
  type Token,
} from "@bera/berajs";
import { honeyFactoryAddress, honeyTokenAddress } from "@bera/config";
import { useAnalytics, useTxn } from "@bera/shared-ui";
import BigNumber from "bignumber.js";
import { Abi, formatUnits, getAddress, parseUnits, type Address } from "viem";

import useMultipleTokenApprovals from "./useMultipleTokenApprovals";

interface PsmHookReturn {
  account: string | undefined;
  payload: readonly [Address, bigint, Address, boolean] | undefined;
  isLoading: boolean;
  selectedFrom: Token[] | undefined;
  selectedTo: Token[] | undefined;
  fee: number;
  isReady: boolean | undefined;
  isFeeLoading: boolean;
  fromAmount: Record<Address, string | undefined>;
  toAmount: Record<Address, string | undefined>;
  isMint: boolean;
  fromBalance: Array<string | undefined>;
  toBalance: Array<string | undefined>;
  ModalPortal: ReactElement<any, any>;
  needsApproval: TokenWithAmount[];
  exceedBalance: boolean[] | undefined;
  honey: Token | undefined;
  collateralList: Token[] | undefined;
  isTyping: boolean;
  isBadCollateral: boolean | undefined;
  isBasketModeEnabled: boolean | undefined;
  collateralWeights: Record<Address, bigint> | undefined;
  setSelectedFrom: Dispatch<SetStateAction<Token[]>>;
  setSelectedTo: Dispatch<SetStateAction<Token[]>>;
  setFromAmount: Dispatch<SetStateAction<Record<Address, string | undefined>>>;
  setToAmount: Dispatch<SetStateAction<Record<Address, string | undefined>>>;
  setGivenIn: Dispatch<SetStateAction<boolean>>;
  setIsTyping: Dispatch<SetStateAction<boolean>>;
  setChangedAsset: Dispatch<SetStateAction<Address | undefined>>;
  onSwitch: () => void;
  refreshAllowances: () => void;
  write: (args: IContractWrite<Abi, string>) => void;
}

/**
 * A React hook for managing PSM (Peg Stability Module) operations in the Honey protocol.
 * Handles minting and redeeming of Honey tokens with various collateral assets.
 *
 * @returns {PsmHookReturn} An object containing the hook's return values.
 */
export const usePsm = (): PsmHookReturn => {
  // Track whether user is currently typing amounts
  const [isTyping, setIsTyping] = useState(false);
  // State for selected tokens and amounts
  const [selectedTo, setSelectedTo] = useState<Token[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<Token[]>([]);
  const [givenIn, setGivenIn] = useState<boolean>(true);
  // State for input/output amounts
  const [fromAmount, setFromAmount] = useState<
    Record<Address, string | undefined>
  >({});
  const [toAmount, setToAmount] = useState<Record<Address, string | undefined>>(
    {},
  );
  // state for the asset that is changed, usefull to keep a value still in the input field
  const [changedAsset, setChangedAsset] = useState<Address | undefined>(
    undefined,
  );
  const { isReady, account } = useBeraJs();

  // Get token data and filter for collateral tokens
  const { data: tokenData } = useTokens();
  const { data: collateralList } = useHoneyCollaterals(tokenData);
  // Find the default collateral token and get the HONEY token
  const honey = tokenData?.tokenDictionary
    ? tokenData?.tokenDictionary[getAddress(honeyTokenAddress)]
    : undefined;
  const defaultCollateral = collateralList?.find((token: any) =>
    token.tags.includes("defaultCollateral"),
  );

  // Determine if operation is mint (true) or redeem (false)
  // Mint: input is collateral, output is HONEY
  // Redeem: input is HONEY, output is collateral
  const isMint = selectedFrom?.length
    ? selectedFrom?.[0].address !== honey?.address
    : true;

  // Check if basket mode is enabled for current operation
  const { data: isBasketModeEnabled } = useIsBasketModeEnabled({ isMint });

  // ===== INITIAL SELECTIONS =====
  // Initialize default selections when tokens are loaded
  useEffect(() => {
    if (
      defaultCollateral &&
      honey &&
      !selectedFrom?.length &&
      !selectedTo?.length
    ) {
      // Create initial collateral list with default first
      const initCollateralList = collateralList?.length
        ? [
            defaultCollateral,
            ...collateralList.filter(
              (token) => token.address !== defaultCollateral.address,
            ),
          ]
        : [defaultCollateral];

      setSelectedFrom(initCollateralList);
      setSelectedTo([honey]);
    }
  }, [collateralList, honey]);

  // Get collateral tokens based on operation type
  const collaterals = isMint ? selectedFrom : selectedTo;

  // ===== BAD COLLATERAL =====
  // Check if selected collaterals are flagged as bad (blacklisted or depegged)
  const isBadCollateral1 = useIsBadCollateralAsset({
    collateral: collaterals[0]?.address,
  });
  const isBadCollateral2 = useIsBadCollateralAsset({
    collateral: collaterals[1]?.address,
  });
  const isBadCollateral =
    isBadCollateral1.data?.isBlacklisted ||
    isBadCollateral1.data?.isDepegged ||
    isBadCollateral2.data?.isBlacklisted ||
    isBadCollateral2.data?.isDepegged;

  // ===== TOKEN BALANCES =====
  // retrieve token balances for both input and output tokens
  const fromBalance1 = usePollBalance({
    address:
      selectedFrom[0]?.address ??
      getAddress("0x0000000000000000000000000000000000000000"),
  });
  const fromBalance2 = usePollBalance({
    address:
      selectedFrom[1]?.address ??
      getAddress("0x0000000000000000000000000000000000000000"),
  });
  const fromBalance = [
    fromBalance1.data?.formattedBalance,
    fromBalance2.data?.formattedBalance,
  ];
  const tobalance1 = usePollBalance({
    address:
      selectedTo[0]?.address ??
      getAddress("0x0000000000000000000000000000000000000000"),
  });
  const toBalance2 = usePollBalance({
    address:
      selectedTo[1]?.address ??
      getAddress("0x0000000000000000000000000000000000000000"),
  });
  const toBalance = [
    tobalance1.data?.formattedBalance,
    toBalance2.data?.formattedBalance,
  ];

  // ===== FEE =====
  // Get current fees for selected collateral
  const { getCollateralRate, isLoading: isFeeLoading } = useCollateralsRates({
    collateralList: collateralList?.map((token: any) => token.address) ?? [],
  });
  const params =
    collaterals?.length && isBasketModeEnabled !== undefined
      ? getCollateralRate(
          collaterals[0].address as Address,
          isBasketModeEnabled,
        )
      : undefined;
  const fee = params ? (isMint ? params.mintFee : params.redeemFee) : 0;

  // ===== COLLATERAL WEIGHTS =====
  // Get collateral weights for basket mode
  const { data: collateralWeights } = useCollateralWeights();

  // create the write transaction to actually mint or redeem
  // Analytics
  const { captureException, track } = useAnalytics();
  const {
    write,
    isLoading: isUseTxnLoading,
    ModalPortal,
  } = useTxn({
    message: isMint
      ? `Mint ${
          Number(toAmount[honeyTokenAddress]) < 0.01
            ? "<0.01"
            : Number(toAmount[honeyTokenAddress]).toFixed(2)
        } Honey`
      : `Redeem ${
          Number(fromAmount[honeyTokenAddress]) < 0.01
            ? "<0.01"
            : Number(fromAmount[honeyTokenAddress]).toFixed(2)
        } Honey`,
    actionType: isMint
      ? TransactionActionType.MINT_HONEY
      : TransactionActionType.REDEEM_HONEY,
    onSuccess: () => {
      track(`${isMint ? "mint" : "redeem"}_honey`, {
        amountCollaterals: isMint ? fromAmount : toAmount,
        amountHoney: isMint
          ? toAmount[honeyTokenAddress]
          : fromAmount[honeyTokenAddress],
        collateralTokens: collaterals,
        basketMode: isBasketModeEnabled,
      });
    },
    onError: (e: Error | undefined) => {
      track(`${isMint ? "mint" : "redeem"}_honey_failed`, {
        amountCollaterals: isMint ? fromAmount : toAmount,
        amountHoney: isMint
          ? toAmount[honeyTokenAddress]
          : fromAmount[honeyTokenAddress],
        collateralTokens: collaterals,
        basketMode: isBasketModeEnabled,
      });
      captureException(e);
    },
  });

  // Calculate amounts when inputs change
  const { data: previewRes, isLoading: isHoneyPreviewLoading } =
    usePollHoneyPreview({
      collateral: isTyping
        ? undefined
        : collaterals.find((token) => token.address === changedAsset) ??
          collaterals[0],
      collateralList: isBasketModeEnabled ? collateralList : undefined,
      amount: changedAsset
        ? givenIn
          ? fromAmount[changedAsset] ?? "0"
          : toAmount[changedAsset] ?? "0"
        : "0",
      mint: isMint,
      given_in: givenIn,
    });

  // Update amounts based on preview results
  useEffect(() => {
    if (previewRes) {
      // Convert collateral amounts from raw units to formatted units (with proper decimals)
      const newCollaterals: Record<Address, string> = Object.keys(
        previewRes?.collaterals,
      ).reduce(
        (attrs, key) => ({
          ...attrs,
          [key]: new BigNumber(
            formatUnits(
              previewRes?.collaterals[key as Address] ?? "0",
              // Find the correct decimal places for this token, default to 18 if not found
              collateralList?.find((token) => token.address === key)
                ?.decimals ?? 18,
            ),
          )
            .decimalPlaces(2, 1)
            .toString(),
        }),
        {},
      );

      // Check if we're in basket mode (collaterals missing are represented as 0)
      const previewBasketMode = Object.values(previewRes.collaterals).every(
        (value) => value > 0,
      );

      // Handle Minting logic (collateral -> Honey)
      if (isMint) {
        if (givenIn) {
          // User input collateral amount (fromAmount)
          // Set the resulting Honey amount
          setToAmount({
            [honey?.address!]: new BigNumber(formatUnits(previewRes.honey, 18))
              .decimalPlaces(2, 1)
              .toString(),
          });

          // In basket mode, update all collaterals except the one user is currently modifying
          if (previewBasketMode && changedAsset) {
            setFromAmount((prevColl) => ({
              ...newCollaterals,
              [changedAsset]: Number(prevColl[changedAsset]).toFixed(2),
            }));
          }
        } else {
          // User input Honey amount (toAmount)
          // Set all required collateral amounts
          setFromAmount(newCollaterals);
        }
      }
      // Handle Redeeming logic (Honey -> collateral)
      else {
        if (givenIn) {
          // User input Honey amount (fromAmount)
          // Set resulting collateral amounts
          setToAmount(newCollaterals);
        } else {
          // User input collateral amount (toAmount)
          // Set required Honey amount
          setFromAmount({
            [honey?.address!]: new BigNumber(formatUnits(previewRes.honey, 18))
              .decimalPlaces(2, 1)
              .toString(),
          });

          // In basket mode, update all collaterals except the one user is currently modifying
          if (previewBasketMode && changedAsset) {
            setToAmount((prevColl) => ({
              ...newCollaterals,
              [changedAsset]: Number(prevColl[changedAsset]).toFixed(2),
            }));
          }
        }
      }
    }
  }, [previewRes]);

  // Switch between mint and redeem operations
  const onSwitch = () => {
    const tempFromAmount = fromAmount;
    const tempToAmount = toAmount;

    const tempFrom = selectedFrom;
    const tempTo = selectedTo;

    setSelectedFrom(tempTo);
    setSelectedTo(tempFrom);

    setFromAmount(tempToAmount);
    setToAmount(tempFromAmount);
    setGivenIn(!givenIn);
  };

  // Update token weights when in basket mode with bad collateral
  useEffect(() => {
    if (collateralWeights && selectedFrom.length && selectedTo.length) {
      if (!isBasketModeEnabled) {
        selectedFrom.forEach((token) => (token.weight = undefined));
      } else {
        selectedFrom.forEach((token) => {
          const weight = collateralWeights[token.address];
          if (weight) {
            token.weight = +Number(formatUnits(weight, 18)).toFixed(2);
          }
        });
      }
    }
  }, [collateralWeights, isBasketModeEnabled]);

  // Prepare transaction payload
  const payload =
    collaterals &&
    account &&
    selectedFrom.length &&
    fromAmount[selectedFrom[0].address]
      ? ([
          collaterals.find((token) => token.address === changedAsset)
            ?.address ?? collaterals[0].address,
          parseUnits(
            fromAmount[selectedFrom[0].address]?.toString() ?? "0",
            (isMint ? collaterals[0].decimals : honey?.decimals) ?? 18,
          ),
          account,
          !!isBasketModeEnabled,
        ] as const)
      : undefined;

  // ===== TOKEN APPROVALS =====
  // Check token approvals and balance limits
  const { needsApproval, refresh: refreshAllowances } =
    useMultipleTokenApprovals(
      selectedFrom
        ?.map((token, idx) => ({
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          address: token.address,
          exceeding: false,
          amount: fromAmount[token.address] ?? "0",
        }))
        .filter((token) => token.amount > "0") ?? [],
      honeyFactoryAddress,
    );

  // ===== EXCEEDING BALANCE =====
  // Check if the input amount exceeds the balance
  const exceedBalance = selectedFrom?.map((token, idx) =>
    BigNumber(fromAmount[token.address] ?? "0").gt(fromBalance?.[idx] ?? "0"),
  );

  const isLoading =
    isUseTxnLoading || isHoneyPreviewLoading || !collateralList?.length;
  return {
    account,
    payload,
    isLoading,
    selectedFrom,
    selectedTo,
    fee,
    isReady,
    isFeeLoading,
    fromAmount,
    toAmount,
    isMint,
    fromBalance,
    toBalance,
    ModalPortal,
    exceedBalance,
    needsApproval,
    honey,
    collateralList,
    isTyping,
    isBadCollateral,
    isBasketModeEnabled,
    collateralWeights,
    onSwitch,
    setSelectedTo,
    setFromAmount,
    setToAmount,
    setGivenIn,
    setIsTyping,
    setSelectedFrom,
    setChangedAsset,
    refreshAllowances,
    write,
  };
};

import BigNumber from "bignumber.js";
import { Address } from "viem";

import { TokenBalance } from "./global";

export type Token = {
  logoURI?: string;
  default?: boolean; // TODO: deprecate this
  tags?: string[];
  address: Address;
  decimals: number;
  symbol: string;
  name: string;
  totalSupply?: string;
  usdValue?: string;
  beraValue?: string;
  weight?: number;
};

export interface TokenWithAmount extends Token {
  amount: string;
}

export interface BalanceToken extends Token {
  balance: bigint;
  formattedBalance: string;
}

export interface TokenInput extends Token {
  amount: string;
  exceeding: boolean;
}

export interface SwapRequest {
  tokenIn: Address;
  tokenOut: Address;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  amount: string;
  isWrap: boolean;
  wberaIsBera: boolean;
}

export interface AddLiquidityRequest {
  slippage: number;
  poolPrice: number;
  baseToken: Token;
  quoteToken: Token;
  isAmountBaseDenominated: boolean;
  baseAmount: bigint;
  quoteAmount: bigint;
  poolIdx: number;
  shareAddress?: string;
}

export interface WithdrawLiquidityRequest {
  slippage: number;
  poolPrice: number;
  baseToken: Token | undefined;
  quoteToken: Token | undefined;
  poolIdx: number | undefined;
  percentRemoval: number;
  seeds: string;
  shareAddress?: string;
}

export interface PoolV2 {
  id: string;
  base: Address;
  quote: Address;
  baseInfo: Token;
  quoteInfo: Token;
  timeCreate: number;
  poolIdx: number;
  poolName: string;
  tokens: Token[];
  tvlUsd: number;
  feeRate: number;
  baseTokens: string;
  quoteTokens: string;
  volume24h: number;
  fees24h: number;
  totalApy: number;
  wtv: string;
  shareAddress: string;
  vaultAddress?: string;
  isDeposited?: boolean;
}

export interface IUserPosition {
  lpBalance?: TokenBalance;
  tokenBalances?: TokenBalance[];
  userSharePercentage?: number;
}

export interface ISwaps {
  user: string;
  baseFlow: string;
  quoteFlow: string;
  swapIn: Token;
  swapOut: Token;
  swapInAmount: number;
  swapOutAmount: number;
  transactionHash: string;
  time: number;
  estimatedUsdValue?: number;
  baseAssetUsdPrice: string;
  quoteAssetUsdPrice: string;
}

export interface IProvision {
  user: string;
  baseFlow: number;
  quoteFlow: number;
  changeType: "mint" | "burn";
  transactionHash: string;
  time: number;
  estimatedUsdValue?: number;
  baseAssetUsdPrice: string;
  quoteAssetUsdPrice: string;
}

export interface IUserPool extends PoolV2 {
  userPosition: IUserPosition | undefined;
}

export enum PoolCreationStep {
  POOL_TYPE = "Pool Type",
  SELECT_TOKENS = "Select Tokens",
  DEPOSIT_LIQUIDITY = "Deposit Liquidity",
  SET_PARAMETERS = "Set Parameters",
  SET_INFO = "Set Info",
}

import type { SWRConfiguration, SWRResponse } from "swr";
import type { Address } from "viem";

import type { Token } from "./dex";

export interface BeraConfig {
  endpoints?: {
    tokenList?: string;
    validatorList?: string;
    marketList?: string;
    validatorInfo?: string;
  };
  subgraphs?: {
    honeySubgraph?: string;
    lendSubgraph?: string;
    polSubgraph?: string;
    governanceSubgraph?: string;
  };
  contracts?: {
    multicallAddress?: Address;
    balancerVaultAddress?: Address;
    wrappedTokenAddress?: Address;
    dexAddress?: Address;
    bgtAddress?: Address;
    lendAddressProviderAddress?: Address;
    lendOracleAddress?: Address;
    lendPoolProxyAddress?: Address;
    lendUIDataProviderAddress?: Address;
    lendRewardsAggregatorAddress?: Address;
    honeyFactoryAddress?: Address;
    honeyFactoryReaderAddress?: Address;
    perpsTradingContractAddress?: Address;
    governance?: {
      governor: Address;
      timelock: Address;
    };
  };
}

export type DefaultHookOptions = {
  beraConfigOverride?: BeraConfig; // hooks typically use the useBeraJS hook to get the beraConfig by default, this overrides the beraConfig explicitly
  opts?: SWRConfiguration | undefined;
};

export type DefaultHookReturnType<T = any> = Omit<
  SWRResponse<T, any, any>,
  "mutate"
> & {
  refresh: () => void;
};

export interface PayloadReturnType<T = any[]> {
  payload: T;
  value?: bigint;
}

export interface TokenBalance {
  balance: bigint;
  formattedBalance: string;
}

export interface AllowanceToken extends Token {
  allowance: bigint;
  formattedAllowance: string;
}

export type GaugeMetadata = {
  receiptTokenAddress: Address;
  vaultAddress: Address;
  name: string;
  logoURI?: string;
  product: string;
  url?: string;
  support?: boolean;
};

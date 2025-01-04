import {
  balancerVaultAddress,
  beraTokenAddress,
  bgtTokenAddress,
  governanceSubgraphUrl,
  governanceTimelockAddress,
  governorAddress,
  honeyFactoryAddress,
  honeyFactoryReaderAddress,
  honeySubgraphUrl,
  lendOracleAddress,
  lendPoolAddressProviderAddress,
  lendPoolImplementationAddress,
  lendRewardsAddress,
  lendSubgraphUrl,
  lendUIDataProviderAddress,
  marketListUrl,
  multicallAddress,
  polSubgraphUrl,
  tokenListUrl,
  tradingContractAddress,
  validatorListUrl,
} from "@bera/config";

import type { BeraConfig } from "..";

export const defaultBeraConfig: BeraConfig = {
  endpoints: {
    tokenList: tokenListUrl,
    validatorList: validatorListUrl,
    marketList: marketListUrl,
    validatorInfo: validatorListUrl,
  },
  subgraphs: {
    honeySubgraph: honeySubgraphUrl,
    lendSubgraph: lendSubgraphUrl,
    polSubgraph: polSubgraphUrl,
    governanceSubgraph: governanceSubgraphUrl,
  },
  contracts: {
    multicallAddress: multicallAddress,
    balancerVaultAddress: balancerVaultAddress,
    wrappedTokenAddress: beraTokenAddress,
    bgtAddress: bgtTokenAddress,
    lendAddressProviderAddress: lendPoolAddressProviderAddress,
    lendOracleAddress: lendOracleAddress,
    lendPoolProxyAddress: lendPoolImplementationAddress,
    lendUIDataProviderAddress: lendUIDataProviderAddress,
    lendRewardsAggregatorAddress: lendRewardsAddress,
    honeyFactoryAddress: honeyFactoryAddress,
    honeyFactoryReaderAddress: honeyFactoryReaderAddress,
    perpsTradingContractAddress: tradingContractAddress,
    governance: {
      governor: governorAddress,
      timelock: governanceTimelockAddress,
    },
  },
};

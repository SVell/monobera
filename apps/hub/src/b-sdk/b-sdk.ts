import { ADDRESS_ZERO } from "@bera/berajs/config";
import {
  balancerApiChainName,
  balancerApiUrl,
  balancerQueriesAddress,
  balancerRelayerAddress,
  balancerVaultAddress,
  beraTokenAddress,
  chainId,
  gasTokenDecimals,
  gasTokenName,
  gasTokenSymbol,
} from "@bera/config";
import { defaultBeraNetworkConfig } from "@bera/wagmi/config";
import {
  API_CHAIN_NAMES,
  BALANCER_QUERIES,
  BALANCER_RELAYER,
  BalancerApi,
  CHAINS,
  COMPOSABLE_STABLE_POOL_FACTORY,
  NATIVE_ASSETS,
  Token,
  VAULT,
  WEIGHTED_POOL_FACTORY_BALANCER_V2,
} from "@berachain-foundation/berancer-sdk";

API_CHAIN_NAMES[chainId] = balancerApiChainName;
// @ts-ignore
CHAINS[chainId] = defaultBeraNetworkConfig.chain;
BALANCER_RELAYER[chainId] = balancerRelayerAddress;
VAULT[chainId] = balancerVaultAddress;
BALANCER_QUERIES[chainId] = balancerQueriesAddress;

WEIGHTED_POOL_FACTORY_BALANCER_V2[chainId] = ADDRESS_ZERO;
COMPOSABLE_STABLE_POOL_FACTORY[chainId] = ADDRESS_ZERO;

export const nativeToken = new Token(
  chainId,
  ADDRESS_ZERO,
  gasTokenDecimals,
  gasTokenName,
  gasTokenSymbol,
  beraTokenAddress,
);
// @ts-expect-error not in network list
NATIVE_ASSETS[chainId] = nativeToken;

// NOTE: functionally this is the V3 Balancer SDK (js)
export const balancerApi = new BalancerApi(balancerApiUrl, chainId);

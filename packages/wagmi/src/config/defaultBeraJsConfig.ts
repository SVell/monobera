import {
  blockExplorerName,
  blockExplorerUrl,
  chainId,
  chainName,
  gasTokenDecimals,
  gasTokenIconUrl,
  gasTokenName,
  gasTokenSymbol,
  jsonRpcUrl,
  multicallAddress,
  multicallCreationBlock,
  publicJsonRpcUrl,
} from "@bera/config";
import { EvmNetwork } from "@dynamic-labs/sdk-react-core";
import { type Chain } from "viem";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";

import type { NetworkConfig } from "~/context/context";

const BeraChain: Chain = {
  id: chainId,
  name: chainName,
  nativeCurrency: {
    decimals: gasTokenDecimals,
    name: gasTokenName,
    symbol: gasTokenSymbol,
  },

  contracts: {
    multicall3: {
      address: multicallAddress,
      blockCreated: multicallCreationBlock,
    },
  },
  blockExplorers: {
    etherscan: {
      name: blockExplorerName,
      url: blockExplorerUrl,
    },
    default: {
      name: blockExplorerName,
      url: blockExplorerUrl,
    },
  },
  rpcUrls: {
    default: {
      http: [jsonRpcUrl],
    },
    public: {
      http: [publicJsonRpcUrl],
    },
  },
};

const evmNetwork: EvmNetwork = {
  blockExplorerUrls: [blockExplorerUrl],
  chainId: chainId,
  chainName: chainName,
  iconUrls: [gasTokenIconUrl],
  nativeCurrency: {
    decimals: gasTokenDecimals,
    name: gasTokenName,
    symbol: gasTokenSymbol,
  },
  networkId: chainId,
  privateCustomerRpcUrls: [jsonRpcUrl],
  rpcUrls: [publicJsonRpcUrl],
  vanityName: chainName,
  name: chainName,
};

export const defaultBeraNetworkConfig: NetworkConfig = {
  chain: BeraChain,
  evmNetwork,
};

export const wagmiConfig = createConfig({
  chains: [defaultBeraNetworkConfig.chain],
  multiInjectedProviderDiscovery: false,
  // Setting might to true messes up some pages like lend dashboard and berpetuals charts
  ssr: false,
  // storage: createStorage({
  //   storage: cookieStorage,
  // }),

  batch: {
    /**
     * Undefined multicall address will disable batching
     *
     * @see https://viem.sh/docs/clients/public#batchmulticallwait-optional
     */
    multicall: multicallAddress
      ? {
          wait: 10,
        }
      : undefined,
  },
  transports: {
    [defaultBeraNetworkConfig.chain.id]: http(
      defaultBeraNetworkConfig.chain.rpcUrls.default.http[0] || "",
    ),
  },
});

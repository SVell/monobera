import {
  Oracle,
  OracleMode,
  type Token,
  type TokenInput as TokenInputType,
} from "@bera/berajs";
import { PoolType, ZERO_ADDRESS } from "@berachain-foundation/berancer-sdk";

import { OwnershipType } from "~/app/pools/components/parameters-input";

export enum LOCAL_STORAGE_KEYS {
  CONNECTOR_ID = "CONNECTOR_ID",
  SLIPPAGE_TOLERANCE = "SLIPPAGE_TOLERANCE",
  TRANSACTION_TYPE = "TRANSACTION_TYPE",
  USE_SIGNATURES = "USE_SIGNATURES",
  SLIPPAGE_TOLERANCE_TYPE = "SLIPPAGE_TOLERANCE_TYPE",
  SLIPPAGE_TOLERANCE_VALUE = "SLIPPAGE_TOLERANCE_VALUE",
  DEADLINE_TYPE = "DEADLINE_TYPE",
  DEADLINE_VALUE = "DEADLINE_VALUE",
  CLAIM_REWARDS_RECIPIENT = "CLAIM_REWARDS_RECIPIENT",
}

// TODO (BFE-400): this and settings.tsx are defining similar things (mostly for the swap-settings & settings inputs)

/**
 * Default transaction deadline in seconds.
 * @type {number}
 */
export const DEFAULT_DEADLINE = 30;

/**
 * Default slippage tolerance percentage.
 * @type {number}
 */
export const DEFAULT_SLIPPAGE = 1;

/**
 * Maximum allowed input for a custom deadline in seconds.
 * @type {number}
 */
export const MAX_CUSTOM_DEADLINE = 100000;

/**
 * Minimum allowed input for a custom deadline in seconds.
 * @type {number}
 */
export const MIN_CUSTOM_DEADLINE = 1;

/**
 * Minimum allowed input for a custom slippage tolerance percentage.
 * @type {number}
 */
export const MIN_CUSTOM_SLIPPAGE = 0.1;

/**
 * Maximum allowed input for a custom slippage tolerance percentage.
 * @type {number}
 */
export const MAX_CUSTOM_SLIPPAGE = 100;

export enum TRANSACTION_TYPES {
  LEGACY = "legacy",
  EIP_1559 = "eip1559",
}

export type Reward = {
  id: string;
  pool: string;
  deposited?: number;
  claimable: number;
  brokenDownRewards?: Reward[];
};

export const rewards: Reward[] = [
  {
    id: "728ed52f",
    deposited: 100,
    pool: "Honey / USDC",
    claimable: 100,
    brokenDownRewards: [
      {
        id: "728ed52f-1",
        pool: "Honey",
        deposited: undefined,
        claimable: 50,
      },
      {
        id: "728ed52f-2",
        pool: "USDC",
        deposited: undefined,
        claimable: 50,
      },
      {
        id: "728ed52f-3",
        pool: "BGT",
        deposited: undefined,
        claimable: 50,
      },
    ],
  },
  {
    id: "489e1d42",
    deposited: 125,
    pool: "Staked BERA",
    claimable: 100,
    brokenDownRewards: [
      {
        id: "489e1d42-1",
        pool: "Staked BERA 1",
        deposited: undefined,
        claimable: 50,
      },
      {
        id: "489e1d42-2",
        pool: "Staked BERA 2",
        deposited: undefined,
        claimable: 50,
      },
    ],
  },
  // ...
];

export const tokens = [
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "Bitcoin",
    symbol: "BTC",
    weight: "69%",
    tokenP: "69%",
    balance: "69.420",
    value: "$69,420.00",
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png",
    name: "Litecoin",
    symbol: "LTC",
    weight: "69%",
    tokenP: "69%",
    balance: "69.420",
    value: "$69,420.00",
  },
];

export const liquidityProvisions = [
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    action: "Deposit",
    tokenAmount: "69.420",
    tokenName: "Bitcoin",
    tokenSymbol: "BTC",
    value: "$69,420.00",
    timeStamp: "8 hours ago",
  },
  {
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png",
    action: "Withdraw",
    tokenAmount: "69.420",
    tokenName: "Litecoin",
    tokenSymbol: "LTC",
    value: "$69,420.00",
    timeStamp: "8 hours ago",
  },
];

export const swaps = [
  {
    wallet: "0x1234567890123456789012345678901234567890",
    from: "Bitcoin",
    fromSymbol: "BTC",
    fromAmount: "69.420",
    toAmount: "69.420",
    to: "Litecoin",
    toSymbol: "LTC",
    value: "$69,420.00",
    timeStamp: "8 hours ago",
  },
  {
    wallet: "0x1234567890123456789012345678901234567890",
    from: "Bitcoin",
    fromSymbol: "BTC",
    fromAmount: "69.420",
    toAmount: "69.420",
    to: "Litecoin",
    toSymbol: "LTC",
    value: "$69,420.00",
    timeStamp: "8 hours ago",
  },
];

export const poolDetails = {
  name: "Pool 1",
  poolSymbol: "POOL001",
  poolType: "Liquidity Pool",
  swapFee: "0.3%",
  poolManager: "0x1234567890123456789012345678901234567890",
  poolOwner: "0x1234567890123456789012345678901234567890",
  contractAddress: "0x1234567890123456789012345678901234567890",
  creationDate: "04 May, 2021",
};

export enum POLLING {
  FAST = 10000,
  NORMAL = 20000,
  SLOW = 200000,
}

export enum ParameterPreset {
  USDBACKED = "USD-Backed Stablecoin",
  ALGORITHMIC = "Algorithmic Stablecoin",
}

/**
 * Default pool amplification factor (responsiveness to price fluctuations) for USD-backed stablecoins.
 * @constant {number}
 */
export const DEFAULT_USD_BACKED_AMPLIFICATION = 2500;

/**
 * Default pool amplification factor (responsiveness to price fluctuations) for algorithmic stablecoins.
 * @constant {number}
 */
export const DEFAULT_ALGORITHMIC_AMPLIFICATION = 200;

/**
 * Default pool type for pools is a composable stable pool, which can be referred to as a 'stable pool'.
 * @constant {PoolType}
 */
export const DEFAULT_POOL_TYPE = PoolType.ComposableStable;

/**
 * Default amplification factor for pools is a higher value for USD-backed stablecoin pools (max 5k).
 * @constant {number}
 */
export const DEFAULT_AMPLIFICATION = DEFAULT_USD_BACKED_AMPLIFICATION;

/**
 * Default owner for pools is fixed type, which is the 0x0 address.
 * @constant {Address}
 */
export const DEFAULT_OWNER = ZERO_ADDRESS;

/**
 * Default ownership type for pools is Fixed which yields the 0x0 owner address.
 * @constant {OwnershipType}
 */
export const DEFAULT_OWNERSHIP_TYPE = OwnershipType.Fixed;

/**
 * Default weights for pools is an event split since we default to two tokens.
 * @constant {bigint[]}
 */
export const DEFAULT_WEIGHTS = [500000000000000000n, 500000000000000000n];

/**
 * Default parameter preset for pools is USD-backed stablecoin preset.
 * @constant {ParameterPreset}
 */
export const DEFAULT_PARAMETER_PRESET = ParameterPreset.USDBACKED;

/**
 * Last form step number.
 * @constant {number}
 */
export const LAST_FORM_STEP_NUM = 4; // NOTE: in the future we might consider making this more dynamic/strongly typed via enums.

export const emptyTokenInput: TokenInputType = {
  address: "" as `0x${string}`,
  amount: "0",
  decimals: 18,
  exceeding: false,
  name: "",
  symbol: "",
};
export const emptyToken: Token = {
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
export const DEFAULT_TOKENS = [emptyToken, emptyToken];

/**
 * Default liquidity for pools is two empty tokens.
 * @constant {TokenInputType[]}
 */
export const DEFAULT_LIQUIDITY = [emptyTokenInput, emptyTokenInput];

/**
 * If a rate provider (oracle) is provided, this is the default update interval in seconds (using block.timestamp internally).
 * @constant {number}
 */
export const DEFAULT_ORACLE_CACHE_DURATION = 100;

export const emptyOracle: Oracle = {
  mode: OracleMode.None,
  address: ZERO_ADDRESS,
  tokenAddress: "",
  cacheDuration: DEFAULT_ORACLE_CACHE_DURATION, // NOTE: even if we dont use an oracle, we pass a safe value for this to pool create
};

/**
 * Default oracles for pools is two empty oracles.
 * @constant {Oracle[]}
 */
export const DEFAULT_ORACLES: Oracle[] = [emptyOracle, emptyOracle];

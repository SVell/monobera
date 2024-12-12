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

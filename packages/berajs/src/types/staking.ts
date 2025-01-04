import { ValidatorStakedBgtsFragment } from "@bera/graphql/pol/subgraph";
import { Address } from "viem";

import type { Token } from "./dex";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";

export interface ValidatorInfo {
  id: Address;
  name: string;
  Description: string;
  website: string;
  logoURI: string;
  twitter?: string;
}

export type Validator = ApiValidatorFragment;

export type UserValidator = Validator & {
  amountDeposited: string;
  amountQueued: string;
  latestBlock: string;
  latestBlockTime: string;
  canActivate?: boolean;
};

interface ProductMetadata {
  name: string;
  logoURI: string;
  url: string;
  description: string;
}

export type Vault = {
  logoURI: string;
  name: string;
  product: string;
  receiptTokenAddress: Address;
  url: string;
  vaultAddress: Address;
  productMetadata?: ProductMetadata;
};

export type RewardVaultIncentive = {
  amountRemaining: number;
  id: Address;
  incentiveRate: number;
  manager: Address;
  token: Token;
  vaultId?: Address;
};

export type Market = {
  name: string;
  logoURI: string;
  url: string;
  description: string;
};

export type UserValidatorBoostQueued = {
  amountQueued: string;
  user: Address;
};

export type UserValidatorBoostDeposited = {
  amountDeposited: string;
  user: Address;
};

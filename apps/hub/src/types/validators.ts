import {
  type CuttingBoardWeight,
  type RewardVaultIncentive,
} from "@bera/berajs";

export interface ActiveIncentiveWithVault extends RewardVaultIncentive {
  // TODO: this should be required
  cuttingBoard?: CuttingBoardWeight;
}

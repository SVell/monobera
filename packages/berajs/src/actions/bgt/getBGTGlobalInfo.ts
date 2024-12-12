import type { BeraConfig, RewardVaultIncentive, Validator } from "~/types";

export interface GlobalInfo {
  bgtInfo: {
    bgtInflation: number;
    bgtPerBlock: number;
    blockCountPerYear: number;
    totalStakeBgt: number;
  };
  incentiveCount: number;
  sumAllIncentivesInHoney: string;
  top3Incentives: { activeIncentives: RewardVaultIncentive[] };
  top3Vaults: { vaults: RewardVaultIncentive[]; total: number };
  top3EmittingValidators: {
    validators: { validator: Validator; stakedVotingPower: number }[];
  };
  validatorCount: number;
  vaultCount: number;
}

export const getBGTGlobalInfo = async (
  config: BeraConfig,
): Promise<GlobalInfo | undefined> => {
  if (!config.endpoints?.polEndpoint) {
    throw new Error("Missing backend endpoint in config");
  }
  try {
    const res = await fetch(`${config.endpoints.polEndpoint}/homepage`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

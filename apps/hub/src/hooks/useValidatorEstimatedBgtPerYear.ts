import { useMemo } from "react";
import { useBlockTime, useAllValidators, type Validator } from "@bera/berajs";

export const useValidatorEstimatedBgtPerYear = (
  validator: Validator,
): number => {
  const { data } = useAllValidators();

  const validatorCounts = data?.validators.validators.length ?? 0;

  const blockTime = useBlockTime();
  return useMemo(() => {
    if (!validatorCounts || !validator) return 0;
    const estimatedBlocksPerYear = (365 * 24 * 60 * 60) / blockTime;
    const estimatedValidatorBlocksPerYear =
      estimatedBlocksPerYear / validatorCounts;
    return (
      estimatedValidatorBlocksPerYear *
      parseFloat(validator.dynamicData?.rewardRate ?? "0")
    );
  }, [validatorCounts, validator]);
};

export const getValidatorEstimatedBgtPerYear = (
  validator: Validator,
  validatorCounts: number,
): number => {
  const blockTime = useBlockTime();
  if (!validatorCounts || !validator) return 0;
  const estimatedBlocksPerYear = (365 * 24 * 60 * 60) / blockTime; // Ensure blockTime is defined somewhere in your code
  const estimatedValidatorBlocksPerYear =
    estimatedBlocksPerYear / validatorCounts;

  return (
    estimatedValidatorBlocksPerYear *
    parseFloat(validator.dynamicData?.rewardRate ?? "0")
  );
};

import { useEffect, useState } from "react";

// NOTE: this manages weights for creating weighted pools using Balancer V2 Vault.
const ONE_IN_18_DECIMALS = BigInt(10 ** 18);

export enum WeightsError {
  WEIGHT_OUT_OF_BOUNDS = "Weights must be larger than 0% and less than 100%",
  TOTAL_WEIGHT_EXCEEDS = "Total weight exceeds 100%",
  TOTAL_WEIGHT_LESS = "Total weight is less than 100%",
}

export function usePoolWeights(initialWeights: bigint[]) {
  const [weights, setWeights] = useState<bigint[]>(initialWeights);
  const [lockedWeights, setLockedWeights] = useState<boolean[]>(
    initialWeights.map(() => false),
  );
  const [weightsError, setWeightsError] = useState<string | null>(null);
  const [isNormalizing, setIsNormalizing] = useState(false);

  const resetWeights = (newWeights: bigint[]) => {
    // Reset weights and locked states given new weights
    setWeights(newWeights);
    setLockedWeights(newWeights.map(() => false));
    setWeightsError(null);
    setIsNormalizing(false);
  };

  // TODO: NOTE: user should be able to modify a value and not have that 'active' value normalized, so that then locking and unlocking is only done by clicking on the lock itself.
  // Function to normalize weights based on locked and unlocked tokens
  const normalizeWeights = (updatedWeights: bigint[]) => {
    const allLocked = lockedWeights.every((locked) => locked);
    if (allLocked) {
      return updatedWeights;
    }

    const totalLockedWeight = updatedWeights.reduce(
      (sum, weight, i) => (lockedWeights[i] ? sum + weight : sum),
      BigInt(0),
    );

    const remainingWeight = ONE_IN_18_DECIMALS - totalLockedWeight;
    const unlockedCount = updatedWeights.reduce(
      (count, _, i) => (!lockedWeights[i] ? count + 1 : count),
      0,
    );

    const normalizedWeights = updatedWeights.map((weight, i) =>
      !lockedWeights[i] ? remainingWeight / BigInt(unlockedCount) : weight,
    );

    const weightSum = normalizedWeights.reduce(
      (sum, weight) => sum + weight,
      BigInt(0),
    );
    const correction = ONE_IN_18_DECIMALS - weightSum;

    if (correction !== 0n) {
      const minUnlockedWeightIndex = normalizedWeights.reduce(
        (minIndex, weight, i) =>
          !lockedWeights[i] &&
          (minIndex === -1 || weight < normalizedWeights[minIndex])
            ? i
            : minIndex,
        -1,
      );

      if (minUnlockedWeightIndex !== -1) {
        normalizedWeights[minUnlockedWeightIndex] += correction;
      }
    }

    return normalizedWeights;
  };

  // Debounced normalization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNormalizing(true);
      setWeights((prevWeights) => normalizeWeights(prevWeights));
      setIsNormalizing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [weights, lockedWeights]);

  // Validation effect for weights
  useEffect(() => {
    const totalWeight = weights.reduce(
      (sum, weight) => sum + weight,
      BigInt(0),
    );

    if (
      weights.some((weight) => weight <= 0n || weight >= ONE_IN_18_DECIMALS)
    ) {
      setWeightsError(WeightsError.WEIGHT_OUT_OF_BOUNDS);
    } else if (totalWeight > ONE_IN_18_DECIMALS) {
      setWeightsError(WeightsError.TOTAL_WEIGHT_EXCEEDS);
    } else if (totalWeight < ONE_IN_18_DECIMALS) {
      setWeightsError(WeightsError.TOTAL_WEIGHT_LESS);
    } else {
      setWeightsError(null);
    }
  }, [weights]);

  // Handlers for weights and locked states
  const handleWeightChange = (index: number, newWeight: bigint) => {
    setLockedWeights((prevLocked) => {
      const updatedLocked = [...prevLocked];
      updatedLocked[index] = true;
      return updatedLocked;
    });

    setWeights((prevWeights) => {
      const updatedWeights = prevWeights.map((weight, i) =>
        i === index ? newWeight : weight,
      );
      return updatedWeights;
    });
  };

  const toggleLock = (index: number) => {
    setLockedWeights((prevLocked) => {
      const updatedLocked = [...prevLocked];
      updatedLocked[index] = !updatedLocked[index];
      return updatedLocked;
    });
  };

  const addWeight = () => {
    setWeights((prevWeights) => {
      const totalExistingWeight = prevWeights.reduce(
        (sum, weight) => sum + weight,
        BigInt(0),
      );
      const updatedWeights = [
        ...prevWeights,
        ONE_IN_18_DECIMALS - totalExistingWeight,
      ];
      return normalizeWeights(updatedWeights);
    });
    setLockedWeights((prevLocked) => [...prevLocked, false]);
  };

  const removeWeight = (index: number) => {
    setWeights((prevWeights) => {
      const updatedWeights = prevWeights.filter((_, i) => i !== index);
      return normalizeWeights(updatedWeights);
    });
    setLockedWeights((prevLocked) => prevLocked.filter((_, i) => i !== index));
  };

  return {
    weights,
    resetWeights,
    lockedWeights,
    weightsError,
    isNormalizing,
    handleWeightChange,
    toggleLock,
    addWeight,
    removeWeight,
  };
}

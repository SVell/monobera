import { Address, keccak256 } from "viem";

import { Validator } from "~/types";
import { useOnChainValidator } from "./useOnChainValidator";
import { useSelectedValidator } from "./useSelectedValidator";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";

export const useValidator = ({ pubkey }: { pubkey: Address }) => {
  const {
    data: indexerValidator,
    isLoading: isIndexerValidatorLoading,
    error: indexerValidatorError,
  } = useSelectedValidator(keccak256(pubkey));

  const {
    data: onChainValidator,
    isLoading: isOnChainValidatorLoading,
    error: onChainValidatorError,
  } = useOnChainValidator({ pubkey });

  return {
    data:
      indexerValidator || onChainValidator
        ? ({
            ...indexerValidator,
            ...onChainValidator,
            operator: onChainValidator?.operator ?? indexerValidator?.operator,
            dynamicData: {
              amountDelegated:
                onChainValidator?.dynamicData?.amountDelegated ??
                indexerValidator?.dynamicData?.amountDelegated ??
                "",
              amountQueued: indexerValidator?.dynamicData?.amountQueued ?? "",
              usersDelegated:
                indexerValidator?.dynamicData?.usersDelegated ?? 0,
              usersQueued: indexerValidator?.dynamicData?.usersQueued ?? 0,
              apy: indexerValidator?.dynamicData?.apy ?? "",
              bgtCapturePercentage:
                onChainValidator?.dynamicData?.bgtCapturePercentage ??
                indexerValidator?.dynamicData?.bgtCapturePercentage ??
                "",
              bgtEmittedAllTime:
                indexerValidator?.dynamicData?.bgtEmittedAllTime ?? "0",
              rewardRate:
                onChainValidator?.dynamicData?.rewardRate ??
                indexerValidator?.dynamicData?.rewardRate ??
                "",
              depositStakedAmount:
                indexerValidator?.dynamicData?.depositStakedAmount ?? "",
            },
            id: onChainValidator?.id ?? indexerValidator?.id ?? "",
            pubkey: onChainValidator?.pubkey ?? indexerValidator?.pubkey ?? "",
            metadata: onChainValidator?.metadata ?? indexerValidator?.metadata,
            rewardAllocationWeights:
              onChainValidator?.rewardAllocationWeights ??
              indexerValidator?.rewardAllocationWeights ??
              [],
          } satisfies ApiValidatorFragment)
        : null,
    isLoading: isIndexerValidatorLoading || isOnChainValidatorLoading,
    error: indexerValidatorError || onChainValidatorError,
  };
};

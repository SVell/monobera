import { TransactionActionType, rewardVaultFactoryAbi } from "@bera/berajs";
import { rewardVaultFactoryAddress } from "@bera/config";
import { useTxn } from "@bera/shared-ui";
import { Address } from "viem";

export const useCreateRewardVault = ({
  tokenAddress,
  onSuccess,
  onError,
}: {
  tokenAddress: Address;
  onSuccess?: (txHash: string) => void;
  onError?: (e: Error | undefined) => void;
}) => {
  const { write, ModalPortal } = useTxn({
    message: "Creating Reward Vault",
    actionType: TransactionActionType.CREATE_REWARDS_VAULT,
    onSuccess: async (txHash: string) => {
      onSuccess?.(txHash);
    },
    onError: (e) => {
      onError?.(e);
    },
  });

  return {
    createRewardVault: () =>
      tokenAddress
        ? write({
            address: rewardVaultFactoryAddress,
            abi: rewardVaultFactoryAbi,
            functionName: "createRewardVault",
            params: [tokenAddress],
          })
        : undefined,
    ModalPortal,
  };
};

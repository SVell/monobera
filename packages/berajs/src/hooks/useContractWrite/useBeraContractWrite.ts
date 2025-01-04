import { useCallback, useReducer } from "react";
import { usePublicClient, useSendTransaction, useWriteContract } from "wagmi";

import { getErrorMessage, getRevertReason } from "~/utils/errorMessages";
import { ActionEnum, initialState, reducer } from "~/utils/stateReducer";
import { useBeraJs } from "~/contexts";
import { DEFAULT_METAMASK_GAS_LIMIT } from "~/utils";
import { usePollTransactionCount } from "../usePollTransactionCount";
import {
  type IContractWrite,
  type IUseContractWriteArgs,
  type useContractWriteApi,
} from "./types";

const increaseByPercentage = (value: bigint, percentage: number) => {
  return value + (value * BigInt(percentage)) / BigInt(100);
};

const useBeraContractWrite = ({
  onSuccess,
  onError,
  onLoading,
  onSubmission,
}: IUseContractWriteArgs = {}): useContractWriteApi => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const { account, config } = useBeraJs();

  const { refresh } = usePollTransactionCount({
    address: account,
  });

  // Reset the state of the hook to the initial state
  const reset = useCallback(() => {
    dispatch({ type: ActionEnum.RESET });
  }, []);

  const write = useCallback(
    async ({
      address,
      abi,
      functionName,
      params,
      value = 0n,
      data,
      gasLimit,
      ...rest
    }: IContractWrite): Promise<void> => {
      dispatch({ type: ActionEnum.LOADING });
      onLoading?.();
      let receipt: Awaited<ReturnType<typeof sendTransactionAsync>>;
      if (!publicClient || !account) return;
      try {
        // Get the next nonce for the account
        const nonce = await publicClient.getTransactionCount({
          address: account,
          blockTag: "pending",
        });

        if (data) {
          // Add gas estimation for direct transactions
          const estimatedGas =
            gasLimit ??
            (await publicClient
              .estimateGas({
                account,
                to: address,
                data,
                value,
              })
              .catch(() => DEFAULT_METAMASK_GAS_LIMIT));

          receipt = await sendTransactionAsync({
            data,
            to: address,
            value,
            gas: estimatedGas,
            nonce: nonce,
          });
        } else {
          // Run simulation and gas estimation in parallel
          // TODO: figure out clean way to early detect errors and effectively show them on the UI
          const [simulationResult, gasEstimateResult] =
            await Promise.allSettled([
              publicClient.simulateContract({
                address: address,
                abi: abi,
                functionName: functionName,
                args: params,
                value: value,
                account: account,
              }),
              // Only estimate gas if no gasLimit is provided
              ...(!gasLimit
                ? [
                    publicClient.estimateContractGas({
                      address: address,
                      abi: abi,
                      functionName: functionName,
                      args: params,
                      value: value,
                      account: account,
                    }),
                  ]
                : []),
            ]);

          if (simulationResult.status === "rejected") {
            throw simulationResult.reason;
          }

          const estimatedGas =
            gasLimit ??
            (gasEstimateResult.status === "fulfilled"
              ? increaseByPercentage(gasEstimateResult.value, 10)
              : DEFAULT_METAMASK_GAS_LIMIT);

          receipt = await writeContractAsync({
            ...simulationResult.value.request,
            gas: estimatedGas,
            nonce: nonce,
          });
        }

        dispatch({ type: ActionEnum.SUBMITTING });
        if (receipt) {
          onSubmission?.(receipt);
          const confirmationReceipt: any = await publicClient
            .waitForTransactionReceipt({
              hash: receipt,
              pollingInterval: 2000,
              timeout: 120000,
              confirmations: 1,
            })
            .catch(async (e) => {
              console.log("CAUGHT ERROR");
              return await publicClient.waitForTransactionReceipt({
                hash: receipt,
                pollingInterval: 2000,
                timeout: 120000,
                confirmations: 1,
              });
            });
          if (confirmationReceipt?.status === "success") {
            dispatch({ type: ActionEnum.SUCCESS });
            onSuccess?.(receipt);
          } else {
            if (process.env.VERCEL_ENV !== "production")
              console.log(confirmationReceipt);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const revertReason = await getRevertReason(
              publicClient,
              confirmationReceipt?.transactionHash,
            );
            onError?.({
              message: revertReason ?? "Something went wrong. Please try again",
              hash: receipt,
            });
          }
        }
      } catch (e: any) {
        if (process.env.VERCEL_ENV !== "production") {
          console.log(e);
        }
        console.log(e);
        dispatch({ type: ActionEnum.ERROR });
        const finalMsg = getErrorMessage(e);
        onError?.({
          message: finalMsg,
          hash: e?.transactionHash,
        });
      } finally {
        await refresh();
      }
    },
    [
      writeContractAsync,
      account,
      publicClient,
      onSuccess,
      onError,
      onLoading,
      onSubmission,
      refresh,
      reset,
    ],
  );

  return {
    isLoading: state.confirmState === "loading",
    isSubmitting: state.confirmState === "submitting",
    isSuccess: state.confirmState === "success",
    isError: state.confirmState === "fail",
    write,
    reset,
  };
};

export default useBeraContractWrite;

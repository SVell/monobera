"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BERA_CHEF_ABI,
  GOVERNANCE_ABI,
  TransactionActionType,
} from "@bera/berajs";
import { useTxn } from "@bera/shared-ui";
import matter from "gray-matter";
import {
  AbiParameter,
  Address,
  encodeFunctionData,
  erc20Abi,
  isAddress,
  parseAbiItem,
} from "viem";

import { useGovernance } from "../app/governance/[genre]/components/governance-provider";
import {
  GovernanceTopic,
  PROPOSAL_GENRE,
} from "../app/governance/governance-genre-helper";
import {
  CustomProposal,
  CustomProposalActionErrors,
  CustomProposalErrors,
  ProposalErrorCodes,
  ProposalTypeEnum,
  SafeProposalAction,
} from "../app/governance/types";

const defaultAction = {
  type: ProposalTypeEnum.CUSTOM_PROPOSAL,
  target: "",
  ABI: "",
  value: 0n,
  functionSignature: "",
  calldata: [],
} satisfies SafeProposalAction;

type CheckProposalFieldResultMinimal = ProposalErrorCodes | null;

type CheckProposalFieldResult =
  | ProposalErrorCodes
  | null
  | CheckProposalFieldResultMinimal[]
  | Record<string, CheckProposalFieldResultMinimal>;

interface CheckProposalField {
  (arg: {
    fieldOrType:
      | "address"
      | "abi"
      | "bool"
      | `uint${string}`
      | `int${string}`
      | "action"
      | "title"
      | "forumLink"
      | "description";
    value: any;
    required?: boolean;
    baseUrl?: string;
    components?: readonly AbiParameter[];
  }): CheckProposalFieldResultMinimal;
  (arg: {
    fieldOrType: "tuple[]" | "tuple";
    value: any;
    required?: boolean;
    baseUrl?: string;
    components?: AbiParameter[];
  }): CheckProposalFieldResult;
}

// @ts-expect-error TODO: this is not typed, will throw if not valid
export const checkProposalField: CheckProposalField = ({
  fieldOrType,
  value,
  required = true,
  baseUrl,
  components,
}) => {
  if (required && !value) {
    return ProposalErrorCodes.REQUIRED;
  }

  if (fieldOrType.startsWith("uint") || fieldOrType.startsWith("int")) {
    if (typeof value !== "string") {
      return ProposalErrorCodes.INVALID_AMOUNT;
    }

    try {
      const valueBN = BigInt(value);
      if (fieldOrType.startsWith("uint")) {
        if (valueBN < 0n) {
          return ProposalErrorCodes.NEGATIVE_AMOUNT;
        }
      }
    } catch (error) {
      return ProposalErrorCodes.INVALID_AMOUNT;
    }
    return null;
  }

  switch (fieldOrType) {
    case "bool":
      // if (value !== "true" && value !== "false") {
      //   return ProposalErrorCodes.INVALID_AMOUNT;
      // }
      return null;

    case "title":
      if (value.length === 0) {
        return ProposalErrorCodes.REQUIRED;
      }
      return null;

    case "description":
      if (value.length === 0) {
        return ProposalErrorCodes.REQUIRED;
      }
      return null;

    case "forumLink":
      if (value.length === 0) {
        return ProposalErrorCodes.REQUIRED;
      }

      if (!URL.canParse(value)) {
        return ProposalErrorCodes.INVALID_ADDRESS;
      }

      // biome-ignore lint/correctness/noSwitchDeclarations: <explanation>
      const base = new URL(baseUrl as string);

      // base.pathname = "/c/";

      if (!value.startsWith(base.toString())) {
        return ProposalErrorCodes.INVALID_BASEPATH;
      }

      return null;

    case "address":
      if (!isAddress(value, { strict: true })) {
        return ProposalErrorCodes.INVALID_ADDRESS;
      }
      return null;

    case "abi":
      try {
        JSON.parse(value);
      } catch (error) {
        return ProposalErrorCodes.INVALID_ABI;
      }
      return null;

    case "action":
      if (!isAddress(value, { strict: true })) {
        return ProposalErrorCodes.INVALID_ADDRESS;
      }
      return null;

    case "tuple":
      if (typeof value === "object" && Array.isArray(components)) {
        const errors: Record<string, ProposalErrorCodes | null> = {};

        for (const component of components) {
          errors[component.name!] = checkProposalField({
            // @ts-expect-error this is not typed, will throw if not valid
            fieldOrType: component.type,
            value: value[component.name!],
          });
        }

        if (Object.values(errors).every((v) => v === null)) {
          return null;
        }

        return errors;
      }

      console.warn("tuple default", value, components);
      return null;

    case "tuple[]":
      if (Array.isArray(value)) {
        const errors = value.map((v) =>
          checkProposalField({
            fieldOrType: "tuple",
            value: v,
            components,
          }),
        );

        if (errors.every((v) => v === null)) {
          return null;
        }

        return errors;
      }

      console.warn("tuple[] default", value, components);
      return null;

    default:
      console.error(`Invalid field or type: ${fieldOrType}`);

      return null;
  }
};

export const getBodyErrors = (
  proposal: CustomProposal,
  currentTopic: GovernanceTopic,
) => {
  const e: CustomProposalErrors = {};
  e.title = checkProposalField({
    fieldOrType: "title",
    value: proposal.title,
  });
  e.description = checkProposalField({
    fieldOrType: "description",
    value: proposal.description,
  });
  e.forumLink = checkProposalField({
    fieldOrType: "forumLink",
    value: proposal.forumLink,
    baseUrl: currentTopic.forumLink,
  });

  return e;
};

export const useCreateProposal = ({
  governorAddress,
  initialData = {},
  onSuccess,
}: {
  governorAddress: Address;
  initialData?: any;
  onSuccess?: (txHash: string) => void;
}) => {
  const [proposal, setProposal] = useState<CustomProposal>({
    title: "",
    description: "",
    forumLink: "",
    actions: [defaultAction],
    ...initialData,
    topic: new Set(),
  });

  const { currentTopic } = useGovernance();

  useEffect(() => {
    setProposal((p) => ({
      ...p,
      topic: new Set<PROPOSAL_GENRE>([currentTopic.id]),
    }));
  }, [currentTopic]);

  const { write, ModalPortal, isSubmitting } = useTxn({
    message: "Submit Proposal",
    actionType: TransactionActionType.SUBMIT_PROPOSAL,
    onSuccess: (txHash) => {
      onSuccess?.(txHash);
    },
  });

  const addProposalAction = useCallback(() => {
    setProposal((p) => ({ ...p, actions: [...p.actions, defaultAction] }));
  }, []);

  const removeProposalAction = useCallback(
    (idx: number) => {
      setProposal((p) => {
        const actions = [...p.actions];
        actions.splice(idx, 1);
        return { ...p, actions };
      });
    },
    [setProposal],
  );

  const submitProposal = useCallback(
    ({ onError }: { onError?: (e: CustomProposalErrors) => void }) => {
      const e: CustomProposalErrors = getBodyErrors(proposal, currentTopic);

      const actions: Address[] = [];

      e.actions = proposal.actions
        .map((action, idx): CustomProposalActionErrors => {
          const errors: CustomProposalActionErrors = {};
          errors.target = checkProposalField({
            fieldOrType: "address",
            value: action.target,
          });

          if (action.type === ProposalTypeEnum.CUSTOM_PROPOSAL) {
            errors.ABI = checkProposalField({
              fieldOrType: "abi",
              value: action.ABI,
            });
            if (!action.functionSignature) {
              errors.functionSignature = ProposalErrorCodes.REQUIRED;
            } else {
              try {
                const parsedSignatureAbi = parseAbiItem(
                  action.functionSignature,
                );
                if (parsedSignatureAbi.type !== "function") {
                  console.error(
                    "parsedSignatureAbi is not a function",
                    parsedSignatureAbi,
                  );

                  errors.functionSignature = ProposalErrorCodes.INVALID_ABI;
                } else {
                  errors.calldata = parsedSignatureAbi.inputs.map(
                    (input, index) => {
                      try {
                        if ("components" in input) {
                          return checkProposalField({
                            // @ts-expect-error this is not typed, will throw if not valid
                            fieldOrType: input.type,
                            value: action.calldata?.[index],
                            components: input.components,
                          });
                        }

                        return checkProposalField({
                          // @ts-expect-error this is not typed, will throw if not valid
                          fieldOrType: input.type,
                          value: action.calldata?.[index],
                        });
                      } catch (error) {
                        return null;
                      }
                    },
                  );

                  actions[idx] = encodeFunctionData({
                    abi: [parsedSignatureAbi],
                    args: action.calldata,
                  });
                }
              } catch (error) {
                errors.functionSignature = ProposalErrorCodes.INVALID_ABI;
              }
            }
          } else if (
            action.type === ProposalTypeEnum.WHITELIST_REWARD_VAULT ||
            action.type === ProposalTypeEnum.BLACKLIST_REWARD_VAULT
          ) {
            errors.vault = checkProposalField({
              fieldOrType: "address",
              value: action.vault,
            });
            errors.isFriend = null; //checkProposalField("bool", action.isFriend);
            const whiteList =
              action.type === ProposalTypeEnum.WHITELIST_REWARD_VAULT
                ? true
                : false;
            if (!errors.vault) {
              actions[idx] = encodeFunctionData({
                abi: BERA_CHEF_ABI,
                functionName: "setVaultWhitelistedStatus",
                args: [action.vault!, whiteList, action.metadata ?? ""], // TODO: A third param was added for metadata. It is optional but we should include it in our action
              });
            }
          } else if (action.type === ProposalTypeEnum.ERC20_TRANSFER) {
            errors.amount = checkProposalField({
              fieldOrType: "uint256",
              value: action.amount,
            });
            errors.to = checkProposalField({
              fieldOrType: "address",
              value: action.to,
            });
            if (!errors.amount && !errors.to) {
              actions[idx] = encodeFunctionData({
                abi: erc20Abi,
                functionName: "transfer",
                args: [action.to!, BigInt(action.amount!)],
              });
            }
          }
          return errors;
        })
        .filter((e) =>
          Object.values(e).some((v) => {
            if (Array.isArray(v)) {
              return v.filter((v) => v).length > 0;
            }

            return !!v;
          }),
        );

      onError?.(e);

      if (
        Object.getOwnPropertyNames(e)
          .map((name) => e[name as keyof typeof e])
          .some((v) => {
            if (Array.isArray(v)) {
              return v.length > 0;
            }

            return !!v;
          })
      ) {
        console.warn("Proposal has errors", e);
        return;
      }

      if (actions.length === 0) {
        throw new Error("No actions submitted in proposal");
      }

      const link = new URL(proposal.forumLink);

      const description = matter.stringify(proposal.description, {
        title: proposal.title,
        topics: Array.from(proposal.topic.values()),
        forumLink: link.toString(),
        version: "1.0.0",
        "content-encoding": "utf-8",
        "content-type": "text/markdown",
        actions: proposal.actions.map((action, idx) => ({
          type: action.type,
          description: "more stuff",
        })),
      });

      write({
        address: governorAddress,
        abi: GOVERNANCE_ABI,
        functionName: "propose",
        params: [
          proposal.actions.map((action) => action.target as `0x${string}`),
          proposal.actions.map((action) => action.value ?? 0n),
          actions,
          description,
        ],
      });
    },
    [proposal, currentTopic],
  );

  return {
    proposal,
    setProposal,
    ModalPortal,
    submitProposal,
    addProposalAction,
    removeProposalAction,
    isSubmitting,
  };
};

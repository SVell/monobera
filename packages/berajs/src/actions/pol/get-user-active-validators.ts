import { BeraConfig } from "~/types";
import { getUserBoosts } from "./getUserBoosts";
import { getAllValidators } from "./get-all-validators";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";
import {
  UserBoostsOnValidator,
  getUserBoostsOnValidator,
} from "./getUserBoostsOnValidator";
import { Address } from "viem";
import { GetPublicClientReturnType } from "@wagmi/core";
import { isSubgraphStale } from "~/utils";

export type ValidatorWithUserBoost = ApiValidatorFragment & {
  userBoosts: UserBoostsOnValidator;
};

export const getUserActiveValidators = async ({
  config,
  account,
  publicClient,
}: {
  config: BeraConfig;
  account: string;
  publicClient?: GetPublicClientReturnType;
}): Promise<ValidatorWithUserBoost[] | undefined> => {
  const userBoosts = await getUserBoosts({ config, account });

  const [validatorInfoList, onChainBoosts] = await Promise.all([
    getAllValidators({
      config,
      variables: {
        where: {
          idIn: userBoosts.data.userValidatorInformations.map(
            (t) => t.validator.id,
          ),
        },
      },
    }),
    publicClient && isSubgraphStale(userBoosts.data._meta?.block.timestamp)
      ? Promise.all(
          userBoosts.data.userValidatorInformations.map((t) =>
            getUserBoostsOnValidator({
              config,
              account: account as Address,
              pubkey: t.validator.publicKey,
              publicClient: publicClient,
            }),
          ),
        )
      : undefined,
  ]);

  return validatorInfoList?.validators.validators.map((validator) => {
    const userDeposited = onChainBoosts
      ? onChainBoosts.find(
          (data) =>
            data.pubkey.toLowerCase() === validator.pubkey.toLowerCase(),
        )
      : userBoosts.data.userValidatorInformations.find(
          (data) =>
            data.validator.id.toLowerCase() === validator.id.toLowerCase(),
        );

    if (!userDeposited) {
      throw new Error("User deposited not found");
    }

    return {
      ...validator,
      userBoosts: {
        pubkey:
          "pubkey" in userDeposited
            ? userDeposited.pubkey
            : userDeposited.validator.publicKey,
        activeBoosts: userDeposited?.activeBoosts,
        queuedBoosts: userDeposited?.queuedBoosts,
        queuedBoostStartBlock: userDeposited?.queuedBoostStartBlock,
        queuedUnboosts: userDeposited?.queuedUnboosts,
        queuedUnboostStartBlock: userDeposited?.queuedUnboostStartBlock,
        hasPendingBoosts:
          Number(userDeposited?.queuedBoosts) > 0 ||
          Number(userDeposited?.queuedUnboosts) > 0,
        hasActiveBoosts: Number(userDeposited?.activeBoosts) > 0,
      } satisfies UserBoostsOnValidator,
    } satisfies ValidatorWithUserBoost;
  });
};

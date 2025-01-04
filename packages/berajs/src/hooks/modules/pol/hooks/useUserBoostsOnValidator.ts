import useSWR from "swr";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { UserBoostsOnValidator, getUserBoostsOnValidator } from "~/actions";
import { useBeraJs } from "~/contexts";
import POLLING from "~/enum/polling";
import { DefaultHookReturnType } from "~/types";

export const useUserBoostsOnValidator = ({
  pubkey,
  ...args
}: {
  pubkey: Address | undefined;
  account?: Address;
}): DefaultHookReturnType<UserBoostsOnValidator> => {
  const { account: connectedAccount, config: beraConfig } = useBeraJs();

  const publicClient = usePublicClient();
  const account = args.account ?? connectedAccount;

  const QUERY_KEY =
    account && pubkey ? ["useUserBoostsOnValidator", pubkey, account] : null;

  const swrResponse = useSWR(
    QUERY_KEY,
    async () => {
      if (!account) {
        throw new Error(
          "useUserBoostsOnValidator needs at least a logged in account",
        );
      }

      if (!pubkey) {
        throw new Error("useUserBoostsOnValidator needs a pubkey");
      }

      return await getUserBoostsOnValidator({
        config: beraConfig,
        account,
        pubkey: pubkey!,
        publicClient,
      });
    },
    {
      refreshInterval: POLLING.NORMAL,
    },
  );

  return { ...swrResponse, refresh: () => swrResponse.mutate() };
};

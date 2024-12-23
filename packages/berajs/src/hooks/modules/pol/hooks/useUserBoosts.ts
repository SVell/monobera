import { useBeraJs } from "~/contexts";

export const useUserBoosts = () => {
  const { account } = useBeraJs();
  const QUERY_KEY = account ? ["useUserBoosts", account] : null;
};

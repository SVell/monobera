import { useMemo } from "react";
import { chainId, tokenListUrl } from "@bera/config";
import useSWRImmutable from "swr/immutable";
import { useLocalStorage } from "usehooks-ts";

import {
  DefaultHookOptions,
  DefaultHookReturnType,
  formatTokenList,
  type Token,
} from "..";
import { getTokens } from "../actions/dex";

export interface GetTokens {
  tokenList?: Token[] | undefined;
  customTokenList?: Token[] | undefined;
  tokenDictionary?: { [key: string]: Token } | undefined;
  featuredTokenList?: Token[] | undefined;
}

export interface IUseTokens extends DefaultHookReturnType<GetTokens> {
  addNewToken: (token: Token | undefined) => void;
  removeToken: (token: Token) => void;
}

export const useTokens = (options?: DefaultHookOptions): IUseTokens => {
  const TOKEN_KEY = "tokens";

  const [localStorageTokenList, setLocalStorageTokenList] = useLocalStorage<
    Token[]
  >(TOKEN_KEY, []);

  const { data: fetchedTokens, ...swrRest } = useSWRImmutable<Token[]>(
    ["useTokens", tokenListUrl],
    async () => {
      return await getTokens();
    },
    {
      ...options?.opts,
    },
  );

  const formattedTokenList = useMemo(
    () => formatTokenList(fetchedTokens ?? [], localStorageTokenList, chainId),
    [fetchedTokens, localStorageTokenList, chainId],
  );

  const addNewToken = (token: Token | undefined) => {
    // Indicate that this token is now accepted into the default list of tokens
    const acceptedToken = {
      ...token,
      default: true,
    };

    // Check if the token already exists in tokenList
    if (
      formattedTokenList?.tokenList?.some(
        (t: { address: string }) =>
          t.address.toLowerCase() === acceptedToken?.address?.toLowerCase(),
      )
    ) {
      return;
    }

    const updatedData = !token
      ? [...localStorageTokenList]
      : [...localStorageTokenList, acceptedToken as Token];
    setLocalStorageTokenList(updatedData);
    swrRest?.mutate();
    // Update config data and store it in localStorage
  };

  const removeToken = (token: Token) => {
    const filteredList = localStorageTokenList.filter(
      (t) => t.address !== token.address,
    );

    const updatedData = [...filteredList];
    setLocalStorageTokenList(updatedData);
    swrRest?.mutate();
  };

  return {
    ...swrRest,
    data: formattedTokenList,
    refresh: () => swrRest?.mutate?.(),
    addNewToken,
    removeToken,
  };
};

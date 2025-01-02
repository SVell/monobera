import { Token } from "../types";

/**
 * fetch and format the token list
 */
function tokenListToDict(list: Token[]): { [key: string]: Token } {
  return list.reduce((acc, item) => {
    // @ts-ignore
    acc[item.address] = item;
    return acc;
  }, {});
}

const formatTokenList = (
  tokenList: Token[],
  externalList: Token[],
  chainId: number,
) => {
  if (!tokenList || tokenList.length === 0)
    return {
      tokenList: externalList ?? [],
      customTokenList: externalList ?? [],
      featuredTokenList: [],
      tokenDictionary: {},
    };
  const defaultList = tokenList
    .filter(
      (token: any) =>
        !token.chainId || Number(token.chainId) === Number(chainId),
    )
    .map((token: any) => {
      return { ...token, default: true };
    });

  const isFeatured = (tag: string) => tag === "featured";

  const defaultFeaturedList = defaultList
    .filter((token: any) => {
      return token.tags.some(isFeatured);
    })
    .map((token: any) => {
      return { ...token, default: true };
    });

  const list = [...defaultList, ...(externalList ?? [])];

  const uniqueList = list.filter(
    (item, index) =>
      list.findIndex((i) => i.address === item.address) === index,
  );

  return {
    tokenList: uniqueList,
    customTokenList: [...(externalList ?? [])],
    tokenDictionary: tokenListToDict(list),
    featuredTokenList: defaultFeaturedList ?? [],
  };
};

export { formatTokenList, tokenListToDict };

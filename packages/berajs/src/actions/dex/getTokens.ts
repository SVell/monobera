import { tokenListUrl } from "@bera/config";

import { Token } from "../../types/dex";

export const getTokens = async (): Promise<Token[]> => {
  try {
    const tokenList = await fetch(tokenListUrl);
    const tokenData = await tokenList.json();
    return tokenData.tokens ?? [];
  } catch (error) {
    console.error("Error fetching token list", error);
    return [];
  }
};

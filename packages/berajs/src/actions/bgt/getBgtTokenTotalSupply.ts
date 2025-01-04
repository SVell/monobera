import { bgtTokenAddress } from "@bera/config";
import { Address, PublicClient, erc20Abi, formatEther } from "viem";

export interface GetBgtTokenTotalSupply {
  publicClient: PublicClient | undefined;
}

export const getBgtTokenTotalSupply = async ({
  publicClient,
}: GetBgtTokenTotalSupply): Promise<string> => {
  if (!publicClient) throw new Error("Missing public client");
  if (!bgtTokenAddress) throw new Error("Missing BGT token address");

  try {
    const result = await publicClient.readContract({
      address: bgtTokenAddress,
      abi: erc20Abi,
      functionName: "totalSupply",
      args: [],
    });
    return formatEther(result ?? 0n);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

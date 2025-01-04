import { bgtTokenAddress } from "@bera/config";
import { Address, PublicClient, erc20Abi, formatEther } from "viem";
import { BGT_ABI } from "~/abi";

export interface GetBgtTokenTotalBoosts {
  publicClient: PublicClient | undefined;
}

export const getBgtTokenTotalBoosts = async ({
  publicClient,
}: GetBgtTokenTotalBoosts): Promise<string> => {
  if (!publicClient) throw new Error("Missing public client");
  if (!bgtTokenAddress) throw new Error("Missing BGT token address");

  try {
    const result = await publicClient.readContract({
      address: bgtTokenAddress,
      abi: BGT_ABI,
      functionName: "totalBoosts",
      args: [],
    });
    return formatEther(result);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

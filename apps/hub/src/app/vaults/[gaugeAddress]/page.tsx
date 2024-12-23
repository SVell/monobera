import React from "react";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { isIPFS } from "@bera/config";
import { Address, createPublicClient, http, isAddress } from "viem";
import { VaultDetails } from "./components/VaultDetails";
import { defaultBeraNetworkConfig } from "@bera/wagmi/config";
import { BERA_VAULT_REWARDS_ABI } from "@bera/berajs/abi";

export function generateMetadata(): Metadata {
  return {
    title: "Reward Vault",
  };
}

export const revalidate = 10;

export default async function PoolPage({
  params,
}: {
  params: { gaugeAddress: Address };
}) {
  if (isIPFS) {
    return null;
  }

  if (!isAddress(params.gaugeAddress)) {
    console.error("Invalid gauge address", params.gaugeAddress);
    notFound();
  }

  const publicClient = createPublicClient({
    // @ts-ignore viem types
    chain: defaultBeraNetworkConfig.chain,
    transport: http(),
  });

  const stakeToken = await publicClient.readContract({
    address: params.gaugeAddress,
    abi: BERA_VAULT_REWARDS_ABI,
    functionName: "stakeToken",
  });

  if (!stakeToken) {
    console.error(
      "Stake token address not found, so vault is invalid",
      stakeToken,
    );
    notFound();
  }

  return <VaultDetails address={params.gaugeAddress} />;
}

export function generateStaticParams() {
  return [
    {
      gaugeAddress: "0x",
    },
  ];
}

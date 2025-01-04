import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { balancerVaultAddress, hubName, isIPFS } from "@bera/config";

import WithdrawPageContent from "../../[poolId]/withdraw/WithdrawPageContent";
import { PoolPageWrapper } from "../details/PoolPageContent";
import { bexSubgraphClient } from "@bera/graphql";
import {
  GetSubgraphPool,
  GetSubgraphPoolQuery,
} from "@bera/graphql/dex/subgraph";
import { wagmiConfig } from "@bera/wagmi/config";
import { vaultV2Abi } from "@berachain-foundation/berancer-sdk";
import { Address } from "viem";
import { readContract } from "@wagmi/core";

export { generateStaticParams } from "../details/page";

export function generateMetadata(): Metadata {
  return {
    title: "Withdraw Liquidity",
    description: `Withdraw your liquidity from ${hubName}`,
  };
}

export const revalidate = 600;

export default async function Withdraw({
  params,
}: {
  params: { poolId: string };
}) {
  try {
    if (isIPFS) {
      return null;
    }
    const subgraphPromise = bexSubgraphClient.query<GetSubgraphPoolQuery>({
      query: GetSubgraphPool,
      variables: {
        id: params.poolId,
      },
    });

    const pool = await readContract(wagmiConfig, {
      address: balancerVaultAddress,
      abi: vaultV2Abi,
      functionName: "getPool",
      args: [params.poolId as Address],
    });

    if (!pool) {
      console.error("Pool not found");
      notFound();
    }

    let subgraphPool;
    try {
      subgraphPool = (await subgraphPromise).data.pool;
    } catch (e) {
      console.error("Subgraph pool not found");
    }

    return (
      <PoolPageWrapper pool={subgraphPool}>
        <WithdrawPageContent poolId={params.poolId!} />
      </PoolPageWrapper>
    );
  } catch (e) {
    console.log(`Error fetching pools: ${e}`);
    notFound();
  }
}

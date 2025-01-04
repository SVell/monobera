import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { balancerVaultAddress, hubName } from "@bera/config";
import { Address } from "viem";

import { readContract } from "@wagmi/core";
import AddLiquidityContent from "./AddLiquidityContent";
import { bexSubgraphClient } from "@bera/graphql";
import {
  GetSubgraphPool,
  GetSubgraphPoolQuery,
} from "@bera/graphql/dex/subgraph";
import { PoolPageWrapper } from "../details/PoolPageContent";
import { wagmiConfig } from "@bera/wagmi/config";
import { vaultV2Abi } from "@berachain-foundation/berancer-sdk";

export function generateMetadata(): Metadata {
  return {
    title: "Add Liquidity",
    description: `Add liquidity to ${hubName}`,
  };
}

export const revalidate = 600;

export default async function PoolPage({
  params,
}: {
  params: { poolId: string };
}) {
  try {
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
        <AddLiquidityContent poolId={params.poolId} />
      </PoolPageWrapper>
    );
  } catch (e) {
    console.log(`Error fetching pools: ${e}`);
    notFound();
  }
}

export { generateStaticParams } from "../details/page";

import React from "react";
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { balancerVaultAddress, isIPFS } from "@bera/config";
import { readContract } from "@wagmi/core";

import PoolPageContent, { PoolPageWrapper } from "./PoolPageContent";
import { bexSubgraphClient } from "@bera/graphql";
import {
  GetSubgraphPool,
  GetSubgraphPoolQuery,
} from "@bera/graphql/dex/subgraph";
import { wagmiConfig } from "@bera/wagmi/config";
import { vaultV2Abi } from "@berachain-foundation/berancer-sdk";
import { Address, erc20Abi } from "viem";

export async function generateMetadata({
  params,
}: {
  params: { poolId: string };
}): Promise<Metadata> {
  if (isIPFS || !params.poolId) return { title: "Pool" };

  const poolName = await readContract(wagmiConfig, {
    address: params.poolId.slice(0, 42) as Address,
    abi: erc20Abi,
    functionName: "name",
  });

  return {
    title: poolName,
  };
}

export const revalidate = 120;

// THIS IS NOT COMPATIBLE WITH IPFS. CHECK THIS CAUSES BUGS
// export const dynamic = "force-dynamic";

export default async function PoolPage({
  params,
}: {
  params: { poolId: string };
}) {
  if (isIPFS) {
    return null;
  }

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
        <PoolPageContent poolId={params.poolId} />
      </PoolPageWrapper>
    );
  } catch (e) {
    console.error(`Error fetching pools: ${e}`);
    notFound();
  }
}

export async function generateStaticParams() {
  if (isIPFS) {
    return [
      {
        poolId: "0x",
      },
    ];
  }
  return [];
  // const res = await bexApiGraphqlClient.query<GetPoolsQuery>({
  //   query: GetPools,
  // });

  // return res.data.poolGetPools.map((pool) => ({
  //   poolId: pool.id,
  // }));
}

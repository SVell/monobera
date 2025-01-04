import { type Metadata } from "next";

import { PoolsPageContent } from "./PoolsPageContent";
import { bexApiGraphqlClient } from "@bera/graphql";
import {
  GetPools,
  GetPoolsQuery,
  GetPoolsQueryVariables,
  GqlChain,
} from "@bera/graphql/dex/api";
import { balancerApiChainName } from "@bera/config";

export const metadata: Metadata = {
  title: "Pools",
  description: "View pools",
};

export const revalidate = 120;

export default async function Pool() {
  const res = await bexApiGraphqlClient.query<
    GetPoolsQuery,
    GetPoolsQueryVariables
  >({
    query: GetPools,
    variables: {
      textSearch: undefined,
      chain: balancerApiChainName as GqlChain,
    },
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <PoolsPageContent pools={res?.data.poolGetPools ?? []} />
    </div>
  );
}

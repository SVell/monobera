import { DefaultHookReturnType } from "@bera/berajs";
import { bexSubgraphClient } from "@bera/graphql";
import {
  GetSubgraphPool,
  GetSubgraphPoolQuery,
  SubgraphPoolFragment,
} from "@bera/graphql/dex/subgraph";
import { POLLING } from "@bera/shared-ui";
import { PoolStateWithBalancesAndDynamicData } from "@berachain-foundation/berancer-sdk";
import useSWR from "swr";

import { balancerApi } from "./b-sdk";

export const useSubgraphPool = ({
  id,
}: {
  id: string;
}): DefaultHookReturnType<
  [
    SubgraphPoolFragment | undefined,
    PoolStateWithBalancesAndDynamicData | undefined,
  ]
> => {
  const subgraph = useSWR(
    id ? `usePool-subgraph-${id}` : null,
    async () => {
      const res = await bexSubgraphClient.query<GetSubgraphPoolQuery>({
        query: GetSubgraphPool,
        variables: { id },
      });

      return res.data?.pool;
    },
    {
      refreshInterval: POLLING.NORMAL,
    },
  );

  const v3Pool = useSWR(
    id ? `usePool-api-${id}` : null,
    async () => {
      return balancerApi.pools.fetchPoolStateWithBalances(id);
    },
    {
      refreshInterval: POLLING.NORMAL,
    },
  );

  return {
    isLoading: subgraph.isLoading || v3Pool.isLoading,
    isValidating: subgraph.isValidating || v3Pool.isValidating,

    data: [subgraph.data ?? undefined, v3Pool.data] as const,
    error: subgraph.error || v3Pool.error,
    refresh: () => {
      subgraph.mutate();
      v3Pool.mutate();
    },
  };
};

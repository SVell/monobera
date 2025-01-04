import { useMemo } from "react";

import { useOnChainPoolData } from "./useOnChainPoolData";
import { useSubgraphPool } from "./useSubgraphPool";

export const usePool = ({ poolId }: { poolId: string }) => {
  const { data, isLoading: isPoolLoading } = useSubgraphPool({
    id: poolId,
  });

  const { data: onChainPool } = useOnChainPoolData(poolId);

  const [subgraphPool, v3Pool] = data ?? [];

  const pool = useMemo(() => {
    if (!subgraphPool) return onChainPool;

    const merge = { ...subgraphPool };

    if (onChainPool) {
      merge.swapFee = onChainPool.swapFee;
      merge.totalShares = onChainPool.totalShares;
      merge.createTime = onChainPool.createTime ?? merge.createTime;
    }

    return merge;
  }, [onChainPool, subgraphPool]);

  return {
    data: [pool, v3Pool] as const,
    isLoading: isPoolLoading,
  };
};

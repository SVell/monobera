"use client";

import { Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { isIPFS } from "@bera/config";
import { isAddress } from "viem";

import AddLiquidityContent from "../../[poolId]/deposit/AddLiquidityContent";

const _AddLiquidityStaticPage = () => {
  if (!isIPFS) {
    return notFound();
  }

  const searchParams = useSearchParams();
  const poolId = searchParams.get("address");

  if (!poolId) {
    return notFound();
  }
  return <AddLiquidityContent poolId={poolId} />;
};

export default function AddLiquidityStaticPage() {
  return (
    <Suspense>
      <_AddLiquidityStaticPage />
    </Suspense>
  );
}

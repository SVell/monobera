"use client";

import { Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { isIPFS } from "@bera/config";
import { isAddress } from "viem";

import WithdrawPageContent from "../../[poolId]/withdraw/WithdrawPageContent";

const _PoolStaticPage = () => {
  if (!isIPFS) {
    return notFound();
  }

  const searchParams = useSearchParams();
  const poolId = searchParams.get("address");

  if (!poolId) {
    return notFound();
  }
  return <WithdrawPageContent poolId={poolId} />;
};

export default function PoolStaticPage() {
  return (
    <Suspense>
      <_PoolStaticPage />
    </Suspense>
  );
}

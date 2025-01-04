"use client";

import { FC, Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { isAddress } from "viem";

import { VaultDetails } from "../[gaugeAddress]/components/VaultDetails";
import Loading from "../[gaugeAddress]/loading";

const Gauge: FC = () => {
  const searchParams = useSearchParams();
  const gaugeAddress = searchParams.get("address");

  if (!gaugeAddress || !isAddress(gaugeAddress)) {
    return notFound();
  }
  return <VaultDetails address={gaugeAddress} />;
};

export default function GaugeStaticPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Gauge />
    </Suspense>
  );
}

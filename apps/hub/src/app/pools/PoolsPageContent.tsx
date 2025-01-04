"use client";

import React from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { SWRFallback } from "@bera/berajs";
import { cloudinaryUrl } from "@bera/config";
import { unstable_serialize } from "swr";

import { PoolSearch } from "./PoolsTable";

export function PoolsPageContent({ pools }: { pools?: any }) {
  const sp = useSearchParams();
  const poolType = sp.get("pool") as "allPools" | "userPools";

  return (
    <SWRFallback
      fallback={{ [unstable_serialize(["useAllPools", ""])]: pools }}
    >
      <div className="mx-auto flex w-full flex-col items-center justify-center gap-8">
        {/* Large Screen */}
        <div className="relative w-full">
          <Image
            src={`${cloudinaryUrl}/station/ctshf1lmqqpyyxkssclz.png`}
            alt="Large Screen Image"
            width={1200}
            height={600}
            className="h-auto w-full object-cover"
          />
        </div>

        {/* Tablet Screen
      <div className="hidden md:block lg:hidden">
        <Image
          src={`${cloudinaryUrl}/DEX/zxxnwkdhfjcikwwgtqpc.png`}
          alt="Tablet Screen Image"
          width={800}
          height={400}
          className="w-full h-auto  object-cover"
        />
      </div> */}

        {/* Mobile Screen */}
        {/* <div className="block xs:hidden">
        <Image
          src={`${cloudinaryUrl}/DEX/zz9s7qxq8g3ykbqtzgxv.png`}
          alt="Mobile Screen Image"
          width={400}
          height={200}
          className="w-full h-auto object-cover"
        />
      </div> */}

        <PoolSearch poolType={poolType || "allPools"} />
      </div>
    </SWRFallback>
  );
}

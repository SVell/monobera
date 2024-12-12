"use client";

import React from "react";
import { cn } from "@bera/ui";
import { Card } from "@bera/ui/card";
import { PoolType } from "@berachain-foundation/berancer-sdk";

interface PoolTypeSelectorProps {
  poolType: PoolType;
  onPoolTypeChange: (type: PoolType) => void;
}

const PoolTypeSelector: React.FC<PoolTypeSelectorProps> = ({
  poolType,
  onPoolTypeChange,
}) => {
  return (
    <section className="flex w-full flex-col gap-4">
      <h2 className="self-start text-xl font-semibold">Select a Pool Type</h2>
      <div className="flex w-full flex-col gap-6">
        <Card
          onClick={() => onPoolTypeChange(PoolType.ComposableStable)}
          className={cn(
            "flex w-full cursor-pointer flex-col gap-0 border border-border p-4",
            poolType === PoolType.ComposableStable && "border-info-foreground",
          )}
        >
          <span className="text-lg font-semibold">Stable</span>
          <span className="-mt-1 text-sm text-muted-foreground">
            Suggested for stable pairs
          </span>
        </Card>
        <Card
          onClick={() => onPoolTypeChange(PoolType.Weighted)}
          className={cn(
            "flex w-full cursor-pointer flex-col gap-0 border border-border p-4",
            poolType === PoolType.Weighted && "border-info-foreground",
          )}
        >
          <span className="text-lg font-semibold">Weighted</span>
          <span className="-mt-1 text-sm text-muted-foreground">
            Customizable pool tokens and weights
          </span>
        </Card>
      </div>
    </section>
  );
};

export default PoolTypeSelector;

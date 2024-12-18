"use client";

import { on } from "events";
import React from "react";
import { SwapFeeInput } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@bera/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@bera/ui/alert";
import { Card } from "@bera/ui/card";
import { InputWithLabel } from "@bera/ui/input";
import { PoolType } from "@berachain-foundation/berancer-sdk";
import { Address } from "viem";

import BeraTooltip from "~/components/bera-tooltip";
import { ParameterPreset } from "../create/CreatePageContent";

export enum OwnershipType {
  Governance = "governance",
  Fixed = "fixed",
  Custom = "custom",
}

interface OwnershipInputProps {
  amplification: number;
  onAmplificationChange: (value: number) => void;
  parameterPreset: ParameterPreset;
  onChangeParameterPresetType: (type: ParameterPreset) => void;
  ownershipType: OwnershipType;
  owner: string;
  onChangeOwnershipType: (type: OwnershipType) => void;
  onOwnerChange: (address: Address) => void;
  invalidAddressErrorMessage: string | null;
  onSwapFeeChange: (fee: number) => void;
  swapFee: number;
  predefinedFees: number[];
  poolType: PoolType;
}

const ParametersInput: React.FC<OwnershipInputProps> = ({
  amplification,
  onAmplificationChange,
  parameterPreset,
  onChangeParameterPresetType,
  ownershipType,
  owner,
  onChangeOwnershipType,
  onOwnerChange,
  invalidAddressErrorMessage,
  onSwapFeeChange,
  poolType,
  swapFee,
  predefinedFees,
}) => {
  // NOTE: Balancer support more types of ownership than the ones we are supporting here: Delegated, Fixed and Custom.
  // ... you can still create Pools with those types of ownership from the contract, but we are not supporting them in the UI.

  return (
    <section className="flex w-full flex-col gap-4">
      {poolType === PoolType.ComposableStable && (
        <>
          <h3 className="self-start text-xl font-semibold">
            Select a Parameter Preset
          </h3>
          <div className="flex w-full flex-col gap-6">
            <Card
              className={cn(
                "flex w-full cursor-pointer flex-col gap-0 border border-border p-4",
                parameterPreset === ParameterPreset.USDBACKED &&
                  "border-info-foreground ",
              )}
              onClick={() =>
                onChangeParameterPresetType(ParameterPreset.USDBACKED)
              }
            >
              <span className="text-lg font-semibold">
                USD-Backed Stablecoin
              </span>
              <span className="-mt-1 text-sm text-muted-foreground">
                For coins that are USD-Backed
              </span>
            </Card>
            <Card
              className={cn(
                "flex w-full cursor-pointer flex-col gap-0 border border-border p-4",
                parameterPreset === ParameterPreset.ALGORITHMIC &&
                  "border-info-foreground ",
              )}
              onClick={() =>
                onChangeParameterPresetType(ParameterPreset.ALGORITHMIC)
              }
            >
              <span className="text-lg font-semibold">
                Algorithmic Stablecoin
              </span>
              <span className="-mt-1 text-sm text-muted-foreground">
                For coins that are maintained through algorithmic mechanisms
              </span>
            </Card>
          </div>
        </>
      )}
      <div className="flex items-center gap-1">
        <h3 className="self-start text-xl font-semibold">Set Swap Fee</h3>
        <div className="pt-[-1]">
          <BeraTooltip
            size="lg"
            wrap
            text="Half of the swap fee goes to the liquidity providers, the other half goes to the protocol."
          />
        </div>
      </div>
      <SwapFeeInput
        initialFee={swapFee}
        onFeeChange={onSwapFeeChange}
        predefinedFees={predefinedFees}
      />

      <div className="flex items-center gap-1">
        <div className="self-start font-semibold">Fee Ownership</div>
        <div className="pt-[-1]">
          <BeraTooltip
            size="lg"
            wrap
            text={`The owner of the pool can make changes, such as setting the swap fee. 
              Ownership by the null address will fix the fee, while ownership by a delegated 
              address will allow governance to modify the fee.`}
          />
        </div>
      </div>

      <div className="flex w-full flex-row gap-6 xl:flex-col xl:gap-3 2xl:flex-row 2xl:gap-6">
        <Card
          onClick={() => onChangeOwnershipType(OwnershipType.Governance)}
          className={cn(
            "flex w-full cursor-pointer flex-col gap-0 border border-border p-4",
            ownershipType === OwnershipType.Governance &&
              "border-info-foreground ",
          )}
        >
          <span className="text-lg font-semibold">Governance</span>
          <span className="-mt-1 text-sm text-muted-foreground">
            Enables fee modification through governance
          </span>
        </Card>
        <Card
          onClick={() => onChangeOwnershipType(OwnershipType.Fixed)}
          className={cn(
            "flex w-full cursor-pointer flex-col gap-0 border border-border p-4",
            ownershipType === OwnershipType.Fixed && "border-info-foreground ",
          )}
        >
          <span className="text-lg font-semibold">Fixed</span>
          <span className="-mt-1 text-sm text-muted-foreground">
            Fee is fixed and unmodifiable
          </span>
        </Card>
        <Card
          onClick={() => onChangeOwnershipType(OwnershipType.Custom)}
          className={cn(
            "flex w-full cursor-pointer flex-col gap-0 border border-border p-4",
            ownershipType === OwnershipType.Custom && "border-info-foreground ",
          )}
        >
          <span className="text-lg font-semibold">Custom Address</span>
          <span className="-mt-1 text-sm text-muted-foreground">
            Update fees through a custom address
          </span>
        </Card>
      </div>
      {ownershipType === OwnershipType.Custom && (
        <div className="pt-2">
          <InputWithLabel
            label="Owner Address"
            disabled={ownershipType !== OwnershipType.Custom}
            variant="black"
            className="bg-transparent"
            value={owner}
            maxLength={42}
            onChange={(e) => {
              const value = e.target.value as Address;
              onOwnerChange(value);
            }}
          />
          {invalidAddressErrorMessage && (
            <Alert variant="destructive" className="my-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{invalidAddressErrorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
      {poolType === PoolType.ComposableStable && (
        // NOTE: at this time there is no need to show advanced settings for pools other than ComposableStable type ones
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Advanced</AccordionTrigger>
            <AccordionContent>
              <InputWithLabel
                label="Amplification"
                variant="black"
                className="bg-transparent"
                value={amplification}
                maxLength={4}
                onChange={(e) => {
                  // NOTE: for some reason max/min dont seem to work in InputWithLabel
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= 5000) {
                    onAmplificationChange(value);
                  }
                }}
                tooltip={
                  <BeraTooltip
                    size="lg"
                    wrap={true}
                    text={`
                  The Amplification Factor (A) controls how aggressively the pool reacts to price fluctuations. Higher A values 
                  maintain tighter spreads for small imbalances but increase slippage during large deviations like depegs. 
                  Conversely, lower A values permit price changes for smaller deviations, but lower efficiency. `}
                  />
                }
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </section>
  );
};

export default ParametersInput;

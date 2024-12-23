import { useEffect, useState } from "react";
import {
  useBeraJs,
  useValidatorByOperator,
  type Validator,
} from "@bera/berajs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bera/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bera/ui/tabs";

import { ValidatorOverview } from "../validator/components/ValidatorOverview";
import { ValidatorPolData } from "../validator/components/ValidatorPolData";
import { ValidatorAnalytics } from "./validator-analytics";
import { ValidatorConfiguration } from "./validator-configuration";
import { ApiValidatorFragment } from "@bera/graphql/pol/api";
import { Address } from "viem";

// import { ValidatorEvents } from "./validator-events";

type ValidatorTabValue = "overview" | "configuration" | "analytics" | "events";

export const ValidatorTabs = ({
  validator,
}: { validator: ApiValidatorFragment }) => {
  const { account } = useBeraJs();
  const { data } = useValidatorByOperator(account ?? "0x");
  const isValidatorWallet =
    data?.validators[0]?.publicKey?.toLowerCase() ===
    validator.pubkey.toLowerCase();

  const [dayRange, setDayRange] = useState("30");
  const [activeTab, setActiveTab] = useState<ValidatorTabValue>("overview");

  useEffect(() => {
    if (activeTab === "configuration" && !isValidatorWallet) {
      setActiveTab("overview");
    }
  }, [isValidatorWallet, activeTab]);

  return (
    <Tabs
      className="mt-4"
      value={activeTab}
      onValueChange={(value: string) =>
        setActiveTab(value as ValidatorTabValue)
      }
      defaultValue="overview"
    >
      <div className="mb-6 flex w-full flex-col justify-between gap-6 sm:flex-row">
        <TabsList variant="ghost">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isValidatorWallet && (
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          )}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {/* <TabsTrigger value="events">Events</TabsTrigger> */}
        </TabsList>
        <TabsContent value="analytics">
          <Select
            onValueChange={(value: "30" | "60" | "90") => setDayRange(value)}
          >
            <SelectTrigger className="flex w-[120px] items-center justify-between rounded-md border border-border">
              <SelectValue placeholder={"30 Days"} defaultValue={"30"} />
            </SelectTrigger>
            <SelectContent className="rounded-md border-2">
              <SelectItem
                value={"30"}
                className="cursor-pointer rounded-md hover:bg-muted hover:text-foreground focus:text-foreground"
              >
                30 Days
              </SelectItem>
              <SelectItem
                value={"60"}
                className="cursor-pointer rounded-md hover:bg-muted hover:text-foreground focus:text-foreground"
              >
                60 Days
              </SelectItem>
              <SelectItem
                value={"90"}
                className="cursor-pointer rounded-md hover:bg-muted hover:text-foreground focus:text-foreground"
              >
                90 Days
              </SelectItem>
            </SelectContent>
          </Select>
        </TabsContent>
      </div>

      <TabsContent value="overview">
        <ValidatorOverview validator={validator} />
        <ValidatorPolData validator={validator} />
      </TabsContent>
      <TabsContent value="configuration">
        <ValidatorConfiguration
          validatorPublicKey={data?.validators[0]?.publicKey ?? "0x"}
        />
      </TabsContent>
      <TabsContent value="analytics">
        <ValidatorAnalytics
          dayRange={dayRange}
          validatorAddress={validator.pubkey as Address}
        />
      </TabsContent>
      {/* TODO: Uncomment this when we have the events data */}
      {/* <TabsContent value="events">
        <ValidatorEvents validatorAddress={validator.pubkey} />
      </TabsContent> */}
    </Tabs>
  );
};

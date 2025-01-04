import React from "react";
import { type Metadata } from "next";
import { ValidatorsBanner } from "./components/validator-banner";
import { ValidatorsGlobalInfo } from "./components/validator-global-info";
import ValidatorsTable from "./components/ValidatorsTable";
import { ValidatorsPortalStatus } from "./components/ValidatorsPortalStatus";

export const metadata: Metadata = {
  title: "Validators",
  description: "View active validators on Berachain",
};

export default async function Page() {
  return (
    <div className="flex flex-col gap-16">
      <ValidatorsBanner />
      <ValidatorsGlobalInfo />
      <ValidatorsTable />
      <ValidatorsPortalStatus />
    </div>
  );
}

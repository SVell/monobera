import React from "react";
import { type Metadata } from "next";
import { Address } from "viem";

import { Incentivize } from "./incentivize";

export const metadata: Metadata = {
  title: "Incentivize",
  description: "Incentivize a reward vault",
};

export default function Page() {
  return <Incentivize />;
}

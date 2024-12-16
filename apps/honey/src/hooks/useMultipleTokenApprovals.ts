"use client";

import { useEffect, useState } from "react";
import {
  TokenWithAmount,
  usePollAllowances,
  type Token,
  type TokenInput,
} from "@bera/berajs";
import { Address } from "viem";

const useMultipleTokenApprovals = (
  tokenInput: TokenInput[],
  spender: Address,
) => {
  const [needsApproval, setNeedsApproval] = useState<Token[]>([]);

  const tokens = tokenInput
    .filter((token: TokenInput) => token !== undefined)
    .map((token) => token);

  const { data: allowances, refresh } = usePollAllowances({
    spender,
    tokens,
  });

  useEffect(() => {
    if (allowances) {
      const needsApproval = allowances
        ?.map((allowance) => {
          const token = tokens.find(
            (token: TokenInput) => token?.address === allowance.address,
          );
          if (
            allowance.formattedAllowance === "0" ||
            Number(allowance.formattedAllowance) < Number(token?.amount ?? 0)
          ) {
            return allowance;
          }
        })
        .filter((token) => token !== undefined) as Token[];
      setNeedsApproval(needsApproval);
    }
  }, [allowances]);

  return {
    needsApproval: needsApproval as TokenWithAmount[],
    refresh,
  };
};

export default useMultipleTokenApprovals;

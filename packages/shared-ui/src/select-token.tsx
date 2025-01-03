import React from "react";
import { type Token } from "@bera/berajs";
import { cn } from "@bera/ui";
import { Button } from "@bera/ui/button";
import { Icons } from "@bera/ui/icons";
import { type Address } from "viem";

import { TokenDialog, TokenIcon } from "./";

type Props = {
  token: Token | undefined;
  onTokenSelection?: (token: Token | undefined) => void;
  selectedTokens?: (Token | undefined)[];
  customTokenList?: (Token | undefined)[];
  selectable: boolean;
  filter?: Address[];
  className?: string;
  btnClassName?: string;
  walletAddress?: Address;
  filteredTokenTags?: string[];
  filteredSymbols?: string[];
};

export function SelectToken({
  token = undefined,
  onTokenSelection = undefined,
  selectedTokens = undefined,
  customTokenList = undefined,
  walletAddress,
  selectable,
  filter = [],
  className = "",
  btnClassName = "",
  filteredTokenTags = [],
  filteredSymbols = [],
}: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("w-fit", className)}>
      <Button
        className={cn(
          "flex h-10 w-full shrink-0 gap-1 border-border bg-background p-2 text-secondary-foreground shadow",
          btnClassName,
          !selectable && "pointer-events-none !cursor-default",
        )}
        variant={"outline"}
        onClick={() => selectable && setOpen(true)}
      >
        {token ? (
          <div className="flex flex-row items-center justify-start gap-1">
            <TokenIcon address={token.address} />
            <span className="w-fit max-w-[140px] overflow-hidden truncate text-base">
              {token?.symbol}{" "}
            </span>
            {token.weight && (
              <span className="ml-1 text-muted-foreground">
                {(token.weight * 100).toFixed(0)}%
              </span>
            )}
          </div>
        ) : (
          <p
            className="flex flex-row items-center px-1 text-base font-medium whitespace-nowrap"
            suppressHydrationWarning
          >
            {" "}
            Select <span className="hidden ml-1 md:inline"> a token</span>
            {/* <Icons.chevronDown className="w-4 h-4 ml-1" />{" "} */}
          </p>
        )}
        {selectable && <Icons.chevronDown className="w-4 h-4" />}
      </Button>

      {selectable && (
        <TokenDialog
          open={open}
          onSelectedToken={(token: Token | undefined) =>
            onTokenSelection?.(token)
          }
          walletAddress={walletAddress}
          setOpen={setOpen}
          selectedTokens={selectedTokens ?? []}
          focusedToken={token}
          customTokens={customTokenList}
          filter={filter}
          filteredTokenTags={filteredTokenTags}
          filteredSymbols={filteredSymbols}
        />
      )}
    </div>
  );
}

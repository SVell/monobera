"use client";

import { truncateHash, useTokens } from "@bera/berajs";
import { blockExplorerUrl, honeyTokenAddress } from "@bera/config";
import { type HoneyTxn } from "@bera/graphql";
import { FormattedNumber, TokenIcon, Tooltip } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { Icons } from "@bera/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bera/ui/table";
import { formatDistance } from "date-fns";
import { formatUnits, getAddress } from "viem";

const getTokenDisplay = (event: HoneyTxn, tokenDictionary: any) => {
  const honey = tokenDictionary?.[getAddress(honeyTokenAddress)];
  const collateral1 =
    tokenDictionary?.[getAddress(event.collateral[0].collateral)];
  const collateral2 =
    event.collateral.length > 1
      ? tokenDictionary?.[getAddress(event.collateral[1]?.collateral)]
      : null;

  if (event.type === "Mint") {
    return (
      <div className="space-evenly flex flex-row items-center">
        <Tooltip
          toolTipTrigger={
            <div className="flex items-center -me-2">
              <TokenIcon address={collateral1?.address} />
              {collateral2 && (
                <TokenIcon address={collateral2?.address} className="-ms-2" />
              )}
              <Icons.chevronRight className="mx-2" />
              <TokenIcon address={honeyTokenAddress} />
            </div>
          }
          children={
            <div className="p-1 flex items-center">
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <TokenIcon address={collateral1?.address} />
                    <FormattedNumber
                      value={formatUnits(
                        BigInt(event.collateral[0].collateralAmount),
                        collateral1?.decimals ?? 18,
                      )}
                      compact={false}
                      compactThreshold={999_999}
                    />
                  </div>
                  {collateral2 && <hr className="w-full my-1" />}
                  <div className="flex items-center gap-2">
                    {collateral2 && (
                      <>
                        <TokenIcon
                          address={collateral2?.address}
                          className="-ms-2"
                        />
                        <FormattedNumber
                          value={formatUnits(
                            BigInt(event.collateral[1].collateralAmount),
                            collateral2?.decimals ?? 18,
                          )}
                          compact={false}
                          compactThreshold={999_999}
                        />
                      </>
                    )}
                  </div>
                </div>
                <Icons.chevronRight className="mx-2" size={15} />
                <TokenIcon address={honeyTokenAddress} />
                <FormattedNumber
                  value={formatUnits(
                    BigInt(event.collateral[0].honeyTxn.honeyAmount),
                    honey?.decimals ?? 18,
                  )}
                  compact={false}
                  compactThreshold={999_999}
                />
              </div>
            </div>
          }
        />
      </div>
    );
  }
  return (
    <div className="space-evenly flex flex-row items-center">
      <Tooltip
        toolTipTrigger={
          <div className="flex items-center reversed -me-2">
            <TokenIcon address={honeyTokenAddress} />
            <Icons.chevronRight className="mx-2" />
            <TokenIcon address={collateral1?.address} />
            {collateral2 && (
              <TokenIcon address={collateral2?.address} className="-ms-2" />
            )}
          </div>
        }
        children={
          <div className="p-1 flex items-center">
            <div className="flex items-center gap-2">
              <TokenIcon address={honeyTokenAddress} />
              <FormattedNumber
                value={formatUnits(
                  BigInt(event.collateral[0].honeyTxn.honeyAmount),
                  honey?.decimals ?? 18,
                )}
                compact={false}
                compactThreshold={999_999}
              />
            </div>
            <Icons.chevronRight className="mx-2" size={15} />
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <TokenIcon address={collateral1?.address} />
                <FormattedNumber
                  value={formatUnits(
                    BigInt(event.collateral[0].collateralAmount),
                    collateral1?.decimals ?? 18,
                  )}
                  compact={false}
                  compactThreshold={999_999}
                />
              </div>
              {collateral2 && <hr className=" my-1 w-full" />}
              <div className="flex items-center gap-2">
                {collateral2 && (
                  <>
                    <TokenIcon
                      address={collateral2?.address}
                      className="-ms-2"
                    />
                    <FormattedNumber
                      value={formatUnits(
                        BigInt(event.collateral[1].collateralAmount),
                        collateral2.decimals ?? 18,
                      )}
                      compact={false}
                      compactThreshold={999_999}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export const EventTable = ({
  events,
  isLoading,
  arcade,
}: {
  // events: HoneyMint[] | HoneyRedemption[] ;
  events: HoneyTxn[];
  isLoading: boolean | undefined;
  arcade: boolean;
}) => {
  const { data: tokenData } = useTokens();
  return (
    <Table>
      <TableHeader>
        <TableRow
          className={
            arcade
              ? "border-b border-blue-300 bg-blue-100 text-blue-600 hover:bg-blue-100"
              : ""
          }
        >
          <TableHead className={cn(arcade && "text-blue-600")}>
            Action
          </TableHead>
          <TableHead className={cn(arcade && "text-blue-600")}>Value</TableHead>
          <TableHead
            className={cn("hidden sm:table-cell", arcade && "text-blue-600")}
          >
            Tokens
          </TableHead>
          <TableHead
            className={cn("hidden sm:table-cell", arcade && "text-blue-600")}
          >
            TxnHash
          </TableHead>
          <TableHead className={cn("text-center", arcade && "text-blue-600")}>
            Time
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events?.length && events[0] ? (
          events.map((event: HoneyTxn) => {
            if (!event) return null;
            return (
              <TableRow
                className={cn(
                  "hover:cursor-pointer",
                  arcade ? "hover:bg-blue-200" : "hover:bg-muted",
                )}
                key={event.id}
                onClick={() =>
                  window.open(`${blockExplorerUrl}/tx/${event.id}`, "_blank")
                }
              >
                <TableCell
                  className={cn(
                    event.type === "Mint"
                      ? "text-success-foreground"
                      : " text-destructive-foreground",
                  )}
                >
                  {event.type}
                </TableCell>
                <TableCell>
                  <FormattedNumber
                    value={formatUnits(
                      BigInt(
                        event.type === "Mint"
                          ? event.collateral[0].honeyTxn.honeyAmount
                          : event.collateral[0].collateralAmount,
                      ),
                      18,
                    )}
                    symbol="USD"
                    compact={false}
                    compactThreshold={999_999}
                  />
                </TableCell>
                <TableCell className="hidden font-medium sm:table-cell">
                  {getTokenDisplay(event, tokenData?.tokenDictionary)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {truncateHash(event.id ?? "")}
                </TableCell>
                <TableCell
                  className="overflow-hidden truncate whitespace-nowrap text-right "
                  suppressHydrationWarning
                >
                  {formatDistance(
                    new Date(Number(event.timestamp) * 1000 ?? 0),
                    new Date(),
                  )}{" "}
                  ago
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              {isLoading && (events === undefined || events.length === 0) ? (
                <p>Loading...</p>
              ) : (
                <p>No transactions found</p>
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useBeraJs } from "@bera/berajs";
import {
  ConnectWalletBear,
  NotFoundBear,
  SearchInput,
  SimpleTable,
} from "@bera/shared-ui";
import { DataTableLoading } from "@bera/shared-ui/table/legacy";
import { Button } from "@bera/ui/button";
import { Icons } from "@bera/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bera/ui/tabs";

import { getPoolUrl } from "./fetchPools";
import { usePoolTable } from "./usePoolTable";

export const PoolSearch = ({
  poolType = "allPools",
}: {
  poolType: "allPools" | "userPools";
}) => {
  const searchParams = useSearchParams();
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");
  const sort = searchParams.get("sort");
  const direction = searchParams.get("direction");

  const { account } = useBeraJs();
  const [sorting, setSorting] = useState([
    {
      id: sort === null ? "totalLiquidity" : sort,
      desc: direction === null ? true : direction === "desc" ? true : false,
    },
  ]);

  useEffect(() => {}, [sorting]);

  const { search, keyword, isLoading, table, setKeyword, setSearch, data } =
    usePoolTable({
      sorting,
      userPoolsOnly: poolType === "userPools",
      page: parseFloat(page ?? "1"),
      pageSize: parseFloat(pageSize ?? "10"),
    });

  const [isTyping, setIsTyping] = useState(false);

  let typingTimer: NodeJS.Timeout;

  useEffect(() => {
    if (isTyping) return;
    setKeyword(search);
  }, [isTyping, search]);

  const handleClearSearch = () => {
    setKeyword("");
    setSearch("");
  };

  const router = useRouter();

  return (
    <div
      className="w-full flex-row items-center justify-center"
      id="poolstable"
    >
      <Tabs className="flex flex-col gap-4" value={poolType}>
        <div className="flex w-full flex-col items-start justify-between  gap-x-2 gap-y-8 lg:flex-row lg:items-center">
          <TabsList className="w-full  justify-start p-0" variant="ghost">
            <TabsTrigger
              value="allPools"
              className="w-full sm:w-fit"
              variant="compact"
              onClick={handleClearSearch}
            >
              <Link href="/pools?pool=allPools">All Pools</Link>
            </TabsTrigger>
            <TabsTrigger
              value="userPools"
              className="w-full sm:w-fit"
              variant="compact"
              onClick={handleClearSearch}
            >
              <Link href="/pools/?pool=userPools">My Pools</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="allPools" className="w-full text-center">
            <div className="flex w-full gap-x-6 gap-y-3 sm:items-center">
              <SearchInput
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsTyping?.(true);
                  clearTimeout(typingTimer);
                  typingTimer = setTimeout(() => {
                    setIsTyping?.(false);
                  }, 1000);
                  return;
                }}
                placeholder="Search..."
                onKeyDown={(e: any) => {
                  if (e.key === "Enter") {
                    setKeyword(search);
                    clearTimeout(typingTimer);
                    setIsTyping?.(false);
                  }
                }}
                isLoading={isTyping || (isLoading && keyword !== "")}
                id="all-pool-search"
                className="w-full bg-background sm:w-[400px]"
              />
              <Button
                size="md"
                variant="secondary"
                className="flex h-[40px] w-fit flex-row items-center gap-1 whitespace-nowrap bg-transparent sm:w-fit"
                onClick={() => router.push("/pools/create")}
              >
                <Icons.droplet className="h-4 w-4" />
                Create new pool
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="userPools" className="w-full text-center">
            <div className="flex w-full gap-x-6 gap-y-3 sm:items-center">
              <SearchInput
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsTyping?.(true);
                  clearTimeout(typingTimer);
                  typingTimer = setTimeout(() => {
                    setIsTyping?.(false);
                  }, 1000);
                  return;
                }}
                placeholder="Search..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setKeyword(search);
                    clearTimeout(typingTimer);
                    setIsTyping?.(false);
                  }
                }}
                isLoading={isTyping || (isLoading && keyword !== "")}
                id="all-pool-search"
                className="w-full sm:w-[400px]"
              />
              <Button
                size="md"
                variant="secondary"
                className="flex h-[40px] w-fit flex-row items-center gap-1 whitespace-nowrap bg-transparent sm:w-fit"
                onClick={() => router.push("/pools/create")}
              >
                <Icons.droplet className="h-4 w-4" />
                Create new pool
              </Button>
            </div>
          </TabsContent>
        </div>

        <TabsContent value="allPools" className="mt-4 text-center">
          {data === undefined && isLoading ? (
            <div className="flex w-full flex-col items-center justify-center gap-4">
              <DataTableLoading
                columns={table.getAllColumns().length}
                rowCount={parseFloat(pageSize ?? "10")}
              />
            </div>
          ) : data?.length ? (
            <div className="flex w-full flex-col items-center justify-center gap-4">
              <SimpleTable
                table={table}
                flexTable
                dynamicFlex
                variant="ghost"
                mutedBackgroundOnHead={false}
                onRowHover={(row) => {
                  router.prefetch(getPoolUrl(row.original));
                }}
                onRowClick={(row) => router.push(getPoolUrl(row.original))}
                wrapperClassName="bg-transparent border-none"
                showToolbar={true}
              />
            </div>
          ) : (
            <NotFoundBear title="No Pools found." />
          )}
        </TabsContent>

        <TabsContent value="userPools" className="mt-4 text-center">
          {!account ? (
            <ConnectWalletBear
              message="You need to connect your wallet to see deposited pools and
        rewards"
            />
          ) : data === undefined && isLoading ? (
            <div className="flex w-full flex-col items-center justify-center gap-4">
              <DataTableLoading
                columns={table.getAllColumns().length}
                rowCount={parseFloat(pageSize ?? "10")}
              />
            </div>
          ) : data?.length ? (
            <div className="flex w-full flex-col items-center justify-center gap-4">
              <SimpleTable
                table={table}
                flexTable
                dynamicFlex
                variant="ghost"
                mutedBackgroundOnHead={false}
                onRowClick={(row) => router.push(getPoolUrl(row.original))}
                wrapperClassName="bg-transparent border-none"
                showToolbar={true}
              />
            </div>
          ) : (
            <NotFoundBear title="No Pools found." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

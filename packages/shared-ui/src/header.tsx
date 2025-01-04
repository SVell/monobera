"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cn } from "@bera/ui";
import { Icons } from "@bera/ui/icons";

import BannerManager from "./banner-manager";
import { ConnectButton } from "./connect-button";
import { MainNav } from "./main-nav";
import { MobileDropdown } from "./mobile-nav";
import { BGTStatusBtn } from "./bgt-status";
import { useBeraJs } from "@bera/berajs";
import { hubName } from "@bera/config";

const ThemeToggleMobile = dynamic(
  () => import("./theme-toggle-mobile").then((mod) => mod.ThemeToggleMobile),
  {
    ssr: false,
    loading: () => <> </>,
  },
);

export function Header({
  navItems,
  mobileNavItems = [],
  hideConnectBtn = false,
  isHoney = false,
  hideTheme = false,
  appName,
}: {
  navItems: any[];
  mobileNavItems?: any[];
  hideConnectBtn?: boolean;
  isHoney?: boolean;
  hideTheme?: boolean;
  appName?: string;
}) {
  const { isReady } = useBeraJs();

  return (
    <nav
      className={cn(
        "h-18 fixed left-0 right-0 top-0 z-50 w-full border-b border-border bg-background bg-opacity-20 backdrop-blur-2xl",
      )}
    >
      <div className="flex items-end justify-between px-6 py-3">
        <div className="flex items-center">
          <span className="text-lg font-bold tracking-tight lg:mr-5">
            <Link href={"/"}>
              <Icons.logo className="h-12 w-12 text-foreground" />
            </Link>
          </span>
          <MainNav navItems={navItems} />
        </div>

        <div className="flex h-full items-center gap-2 xl:gap-2">
          {/* {!hideTheme && <ThemeToggleMobile />} */}
          {/* <Link
            className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-md sm:flex"
            href={faucetUrl ?? ""}
            target="_blank"
          >
            <Icons.faucetFav className="h-10 w-10 hover:opacity-80" />
          </Link> */}
          {isReady && <BGTStatusBtn isHub={appName === hubName} />}
          {!hideConnectBtn && (
            <ConnectButton
              isNavItem={true}
              isHoney={isHoney}
              disableThemeToggle={hideTheme}
            />
          )}
          <MobileDropdown navItems={isHoney ? mobileNavItems : navItems} />
        </div>
      </div>
      <BannerManager appName={appName} />
    </nav>
  );
}

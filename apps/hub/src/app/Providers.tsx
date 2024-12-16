"use client";

import React, { useEffect, type PropsWithChildren } from "react";
import { BeraJsProvider, BlockTimeProvider } from "@bera/berajs";
import { BeraWagmi } from "@bera/wagmi";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import { ThemeProvider } from "~/components/theme-provider";

export default function Providers({ children }: PropsWithChildren<any>) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    });
  }, []);
  return (
    <PostHogProvider client={posthog}>
      <BeraWagmi>
        <BeraJsProvider configOverride={undefined}>
          <BlockTimeProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              forcedTheme="dark"
              themes={["dark"]}
            >
              {children}
            </ThemeProvider>
          </BlockTimeProvider>
        </BeraJsProvider>
      </BeraWagmi>
    </PostHogProvider>
  );
}

/* eslint-disable no-restricted-imports */
import {
  developmentAnalytics,
  postHogHostAddress,
  postHogProjectKey,
  projectName,
} from "@bera/config";
import {
  captureEvent as _captureEvent,
  captureException as _captureException,
} from "@sentry/react";
import posthog from "posthog-js";

const isDevelopmentWithoutAnalytics =
  process.env.NODE_ENV === "development" && !developmentAnalytics;

// Initialize PostHog
const isPosthogEnabled = postHogProjectKey && !isDevelopmentWithoutAnalytics;

if (isPosthogEnabled) {
  posthog.init(postHogProjectKey, {
    api_host: postHogHostAddress,
    debug: true,
    persistence: "localStorage",
  });
}

export const useAnalytics = () => {
  const captureException: typeof _captureException = (
    error: any,
    hint: any,
  ) => {
    return _captureException(error, hint);
  };

  const setAnalyticsUserId = (userId: string) => {
    if (isPosthogEnabled) {
      posthog.reset();
      posthog.identify(userId);
    }
  };

  const unsetAnalyticsUserId = () => {
    if (isPosthogEnabled) {
      posthog.reset();
    }
  };

  const track = (eventName: string, eventData?: { [key: string]: any }) => {
    if (isPosthogEnabled) {
      posthog.capture(eventName, eventData);
    }
  };

  return { track, setAnalyticsUserId, unsetAnalyticsUserId, captureException };
};

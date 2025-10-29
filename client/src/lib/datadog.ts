// DataDog APM Instrumentation for Next.js Application
// Purpose: Integrate DataDog APM tracing into Next.js application
// Why: Essential for distributed tracing, performance monitoring, and error tracking

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// DataDog APM Configuration
const DATADOG_APPLICATION_ID =
  process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID || "your-app-id";
const DATADOG_CLIENT_TOKEN =
  process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || "your-client-token";
const DATADOG_SITE = (process.env.NEXT_PUBLIC_DATADOG_SITE ||
  "datadoghq.com") as
  | "datadoghq.com"
  | "us3.datadoghq.com"
  | "us5.datadoghq.com"
  | "ap1.datadoghq.com"
  | "eu1.datadoghq.com";
const DATADOG_SERVICE =
  process.env.NEXT_PUBLIC_DATADOG_SERVICE || "ecommerce-frontend";
const DATADOG_ENV = process.env.NEXT_PUBLIC_DATADOG_ENV || "production";

export const initializeDataDog = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (!DATADOG_APPLICATION_ID || !DATADOG_CLIENT_TOKEN) {
    console.warn(
      "DataDog RUM not initialized: Missing Application ID or Client Token"
    );
    return;
  }

  datadogRum.init({
    applicationId: DATADOG_APPLICATION_ID,
    clientToken: DATADOG_CLIENT_TOKEN,
    site: DATADOG_SITE,
    service: DATADOG_SERVICE,
    env: DATADOG_ENV,
    version: "1.0.0", // Replace with actual app version
    sampleRate: 100, // RUM sampling rate
    sessionReplaySampleRate: 20, // Session replay sampling rate
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "mask-user-input",
  });

  datadogLogs.init({
    clientToken: DATADOG_CLIENT_TOKEN,
    site: DATADOG_SITE,
    service: DATADOG_SERVICE,
    env: DATADOG_ENV,
    version: "1.0.0",
    sampleRate: 100,
  });

  datadogRum.startSessionReplayRecording();
};

export const addDataDogAction = (
  name: string,
  context?: Record<string, unknown>
) => {
  if (typeof window !== "undefined" && datadogRum) {
    datadogRum.addAction(name, context);
  }
};

export const setDataDogUser = (user: {
  id: string;
  email: string;
  name?: string;
}) => {
  if (typeof window !== "undefined" && datadogRum) {
    datadogRum.setUser(user);
  }
};

export const trackCustomMetric = (
  name: string,
  value: number,
  tags?: string[]
) => {
  if (typeof window !== "undefined" && datadogRum) {
    datadogRum.addFeatureFlagEvaluation(name, value.toString(), tags); // Using feature flag for custom metrics
  }
};

export const trackError = (error: Error, context?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && datadogRum) {
    datadogRum.addError(error, context);
  }
};

export const trackDatabaseOperation = (
  operation: string,
  duration: number,
  context?: Record<string, unknown>
) => {
  if (typeof window !== "undefined" && datadogRum) {
    datadogRum.addAction(`db.${operation}`, { duration, ...context });
  }
};

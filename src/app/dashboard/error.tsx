"use client";

import AppErrorFallback from "@/components/ui/AppErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppErrorFallback error={error} reset={reset} />;
}

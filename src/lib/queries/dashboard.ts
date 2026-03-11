export const dashboardKeys = {
  all: ["dashboard"] as const,
  balance: () => [...dashboardKeys.all, "balance"] as const,
  summary: (cycleId: string) => [...dashboardKeys.all, "summary", cycleId] as const,
  recent: () => [...dashboardKeys.all, "recent"] as const,
};

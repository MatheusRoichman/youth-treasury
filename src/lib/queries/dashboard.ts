export const dashboardKeys = {
  all: ['dashboard'] as const,
  balance: () => [...dashboardKeys.all, 'balance'] as const,
  recent: () => [...dashboardKeys.all, 'recent'] as const,
};

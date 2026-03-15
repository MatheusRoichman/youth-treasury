export const transactionKeys = {
  all: ['transactions'] as const,
  // biome-ignore lint/suspicious/noExplicitAny: query key factory accepts any filter shape
  list: (params?: Record<string, any>) =>
    [...transactionKeys.all, 'list', params ?? {}] as const,
};

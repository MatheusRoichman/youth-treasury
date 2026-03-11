export const contributionKeys = {
  all: ["contributions"] as const,
  activeCycle: () => [...contributionKeys.all, "active-cycle"] as const,
};

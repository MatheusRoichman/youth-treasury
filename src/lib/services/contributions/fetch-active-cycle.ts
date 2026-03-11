import { http } from "../http";

export interface MemberDTO {
  id: string;
  name: string;
  initials: string;
}

export interface ContributionDTO {
  id: string;
  status: "PENDING" | "PAID" | "EXEMPT";
  amount: string | null;
  paidAt: string | null;
  createdAt: string;
  member: MemberDTO;
}

export interface CycleDTO {
  id: string;
  label: string;
  goalAmount: string;
  isActive: boolean;
  createdAt: string;
  contributions: ContributionDTO[];
}

export async function fetchActiveCycle(): Promise<CycleDTO | null> {
  const { data } = await http.get<CycleDTO | null>("/contributions/active-cycle");
  return data;
}

import { http } from '../http';

export interface CampaignMemberDTO {
  id: string;
  memberId: string;
  campaignId: string;
  expectedAmount: string;
  isExempt: boolean;
  exemptionReason: string | null;
  exemptionCategory: string | null;
  notes: string | null;
  createdAt: string;
  member: { id: string; name: string; initials: string };
  paidAmount: number;
  status: 'EXEMPT' | 'PENDING' | 'PARTIAL' | 'PAID';
}

export interface CampaignTransactionDTO {
  id: string;
  type: 'CONTRIBUTION' | 'EXPENSE';
  category: string;
  description: string;
  amount: string;
  date: string;
  createdAt: string;
  memberId: string | null;
  donorName: string | null;
  vendorName: string | null;
  member: { id: string; name: string; initials: string } | null;
}

export interface CampaignDetailDTO {
  id: string;
  name: string;
  type: 'MONTHLY_FEE' | 'FUNDRAISER';
  goalAmount: string;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  createdAt: string;
  campaignMembers: CampaignMemberDTO[];
  transactions: CampaignTransactionDTO[];
  totalRaised: number;
}

export async function fetchCampaignDetail(
  id: string,
): Promise<CampaignDetailDTO | null> {
  const { data } = await http.get<CampaignDetailDTO | null>(`/campaigns/${id}`);
  return data;
}

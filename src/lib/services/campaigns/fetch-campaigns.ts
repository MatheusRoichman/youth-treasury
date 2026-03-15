import { http } from '../http';

export interface CampaignListItemDTO {
  id: string;
  name: string;
  type: 'MONTHLY_FEE' | 'FUNDRAISER';
  goalAmount: string;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  createdAt: string;
  totalRaised: number;
}

export async function fetchCampaigns(): Promise<CampaignListItemDTO[]> {
  const { data } = await http.get<CampaignListItemDTO[]>('/campaigns');
  return data;
}

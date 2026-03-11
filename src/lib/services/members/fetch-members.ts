import { http } from "../http";

export interface MemberDTO {
  id: string;
  name: string;
  initials: string;
  phone: string | null;
  email: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export async function fetchMembers(): Promise<MemberDTO[]> {
  const { data } = await http.get<MemberDTO[]>("/members");
  return data;
}

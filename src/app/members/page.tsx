import { Users } from "lucide-react";
import { MemberDialog } from "@/components/members/member-dialog";
import { MembersTable } from "@/components/members/members-table";
import { Button } from "@/components/ui/button";
import { getMembers } from "@/lib/db/members";

export default async function MembersPage() {
  const membersRaw = await getMembers();
  const members = membersRaw.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 p-6 space-y-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Membros</h2>
              <p className="text-sm text-gray-500">
                {members.filter((m) => m.status === "ACTIVE").length} membros
                ativos
              </p>
            </div>
          </div>
          <MemberDialog trigger={<Button>Novo Membro</Button>} />
        </div>

        <MembersTable initialMembers={members} />
      </main>
    </div>
  );
}

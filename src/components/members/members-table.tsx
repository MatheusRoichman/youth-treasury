'use client';

import { useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { MemberAvatar } from '@/components/member-avatar';
import { MemberDialog } from '@/components/members/member-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deactivateMember } from '@/lib/actions/members';
import { memberKeys } from '@/lib/queries/members';
import {
  fetchMembers,
  type MemberDTO,
} from '@/lib/services/members/fetch-members';

interface Props {
  initialMembers: MemberDTO[];
}

export function MembersTable({ initialMembers }: Props) {
  const queryClient = useQueryClient();
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const { data: members = initialMembers, isLoading } = useQuery<MemberDTO[]>({
    queryKey: memberKeys.list(),
    queryFn: fetchMembers,
    initialData: initialMembers,
  });

  const deactivate = useMutation({
    mutationFn: deactivateMember,
    onSuccess: () => {
      toast.success('Membro desativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      setDeactivatingId(null);
    },
    onError: () => toast.error('Erro ao desativar membro'),
  });

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [members],
  );

  if (isLoading && !initialMembers.length) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <MemberAvatar
                    name={member.name}
                    initials={member.initials}
                    size="sm"
                  />
                  <span className="font-medium text-gray-900">
                    {member.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {member.phone ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {member.email ?? '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={member.status === 'ACTIVE' ? 'success' : 'neutral'}
                >
                  {member.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <MemberDialog
                      member={member}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          Editar
                        </DropdownMenuItem>
                      }
                    />
                    {member.status === 'ACTIVE' && (
                      <>
                        <DropdownMenuSeparator />
                        {deactivatingId === member.id ? (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => deactivate.mutate(member.id)}
                          >
                            Confirmar desativação
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeactivatingId(member.id)}
                          >
                            Desativar
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {sortedMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-gray-400">
                Nenhum membro cadastrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

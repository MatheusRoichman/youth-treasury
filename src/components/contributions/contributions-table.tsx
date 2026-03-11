"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, MoreVertical, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  exemptContribution,
  markContributionAsPaid,
} from "@/lib/actions/contributions";
import { contributionKeys } from "@/lib/queries/contributions";
import {
  type CycleDTO,
  fetchActiveCycle,
} from "@/lib/services/contributions/fetch-active-cycle";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  initialCycle: CycleDTO;
  defaultGoal: number;
}

const STATUS_LABELS: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  EXEMPT: "Isento",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "neutral"> = {
  PAID: "success",
  PENDING: "warning",
  EXEMPT: "neutral",
};

const PAGE_SIZE = 8;

export function ContributionsTable({ initialCycle, defaultGoal }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data: cycleData, isLoading } = useQuery<CycleDTO | null>({
    queryKey: contributionKeys.activeCycle(),
    queryFn: fetchActiveCycle,
    initialData: initialCycle,
  });
  const cycle: CycleDTO = cycleData ?? initialCycle;

  const markPaid = useMutation({
    mutationFn: markContributionAsPaid,
    onSuccess: () => {
      toast.success("Contribuição marcada como paga!");
      queryClient.invalidateQueries({ queryKey: contributionKeys.all });
    },
    onError: () => toast.error("Erro ao registrar pagamento"),
  });

  const exempt = useMutation({
    mutationFn: exemptContribution,
    onSuccess: () => {
      toast.success("Membro isento com sucesso!");
      queryClient.invalidateQueries({ queryKey: contributionKeys.all });
    },
    onError: () => toast.error("Erro ao isentar membro"),
  });

  const filtered = useMemo(
    () =>
      cycle.contributions.filter((c) =>
        c.member.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [cycle.contributions, search],
  );

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const totalPaid = cycle.contributions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

  const goalAmount = Number(cycle.goalAmount ?? defaultGoal);
  const remaining = Math.max(0, goalAmount - totalPaid);
  const progress =
    goalAmount > 0 ? Math.min(100, (totalPaid / goalAmount) * 100) : 0;

  if (isLoading && !initialCycle) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Total Arrecadado
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(totalPaid)}
          </p>
          <p className="mt-1 text-xs font-medium text-green-500">
            {progress.toFixed(1)}% da meta
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Meta Mensal
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(goalAmount)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Restam {formatCurrency(remaining)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Progresso Geral
            </p>
            <span className="text-sm font-bold text-primary">
              {progress.toFixed(1)}%
            </span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>META</span>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-semibold text-gray-900">Lista de Membros</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar membro..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-8 max-w-[220px] h-8 text-sm"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Nome do Membro
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Data do Pagamento
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <MemberAvatar
                      name={c.member.name}
                      initials={c.member.initials}
                      size="sm"
                    />
                    <span className="font-medium text-gray-900">
                      {c.member.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[c.status]}>
                    {STATUS_LABELS[c.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {c.paidAt ? (
                    <span className="text-sm text-gray-600">
                      {formatDate(new Date(c.paidAt))}
                    </span>
                  ) : (
                    <span className="text-sm italic text-gray-400">
                      Aguardando
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {c.status === "PENDING" ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => markPaid.mutate(c.id)}
                        disabled={markPaid.isPending}
                      >
                        Marcar como Pago
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exempt.mutate(c.id)}
                        disabled={exempt.isPending}
                      >
                        Isentar
                      </Button>
                    </div>
                  ) : c.status === "EXEMPT" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => markPaid.mutate(c.id)}>
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-gray-500">
          <span>
            Exibindo{" "}
            {Math.min(filtered.length, page * PAGE_SIZE + paginated.length)} de{" "}
            {filtered.length} membros ativos
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-base"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              ‹
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-base"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              ›
            </Button>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Dica de Gestão</p>
          <p className="mt-0.5 text-sm text-blue-700">
            A opção <strong>Isentar</strong> deve ser utilizada exclusivamente
            para membros que comprovadamente não possuem condições financeiras
            para a contribuição mensal, garantindo que ninguém seja excluído das
            atividades por motivos econômicos.
          </p>
        </div>
      </div>
    </div>
  );
}

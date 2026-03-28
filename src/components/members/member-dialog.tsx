'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createMember, updateMember } from '@/lib/actions/members';
import { memberKeys } from '@/lib/queries/members';
import { formatPhone } from '@/lib/utils';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const schema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    phone: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    birthDay: z.string().optional(),
    birthMonth: z.string().optional(),
    birthYear: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasDay = !!data.birthDay;
      const hasMonth = !!data.birthMonth;
      return hasDay === hasMonth;
    },
    { message: 'Informe dia e mês', path: ['birthDay'] },
  )
  .refine(
    (data) => {
      if (!data.birthDay) return true;
      const day = Number(data.birthDay);
      return day >= 1 && day <= 31;
    },
    { message: 'Dia inválido', path: ['birthDay'] },
  )
  .refine(
    (data) => {
      if (!data.birthYear) return true;
      const year = Number(data.birthYear);
      return year >= 1900 && year <= new Date().getFullYear();
    },
    { message: 'Ano inválido', path: ['birthYear'] },
  )
  .refine(
    (data) => {
      if (!data.birthDay || !data.birthMonth) return true;
      const day = Number(data.birthDay);
      const month = Number(data.birthMonth);
      // Use a leap year as default so Feb 29 is accepted when year is omitted
      const year = data.birthYear ? Number(data.birthYear) : 2000;
      const date = new Date(year, month - 1, day);
      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    },
    { message: 'Data inválida para o mês informado', path: ['birthDay'] },
  );

type FormValues = z.infer<typeof schema>;

function parseBirthDate(birthDate: string | null) {
  if (!birthDate) return { birthDay: '', birthMonth: '', birthYear: '' };
  const [yearStr, monthStr, dayStr] = birthDate.split('-');
  return {
    birthDay: dayStr ? String(Number(dayStr)) : '',
    birthMonth: monthStr ? String(Number(monthStr)) : '',
    birthYear: yearStr && yearStr !== '1900' ? yearStr : '',
  };
}

function combineBirthDate(day: string, month: string, year: string): string {
  if (!day || !month) return '';
  const y = year || '1900';
  return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

interface Member {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
}

function memberDefaultValues(member?: Member): FormValues {
  return {
    name: member?.name ?? '',
    phone: member?.phone ? formatPhone(member.phone) : '',
    email: member?.email ?? '',
    ...parseBirthDate(member?.birthDate ?? null),
  };
}

interface Props {
  member?: Member;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function MemberDialog({ member, trigger, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: memberDefaultValues(member),
  });

  useEffect(() => {
    if (open) {
      form.reset(memberDefaultValues(member));
    }
  }, [open, member, form]);

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      phone: values.phone?.replace(/\D/g, '') || undefined,
      email: values.email,
      birthDate: combineBirthDate(
        values.birthDay ?? '',
        values.birthMonth ?? '',
        values.birthYear ?? '',
      ),
    };
    const result = member
      ? await updateMember(member.id, payload)
      : await createMember(payload);

    if (result.success) {
      toast.success(
        member ? 'Membro atualizado!' : 'Membro criado com sucesso!',
      );
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
      setOpen(false);
      onSuccess?.();
    } else {
      toast.error(result.error ?? 'Erro ao salvar membro');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      inputMode="numeric"
                      {...field}
                      onChange={(e) =>
                        field.onChange(formatPhone(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Data de Nascimento</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="birthDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Dia"
                          min={1}
                          max={31}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthMonth"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MONTHS.map((month, i) => (
                            <SelectItem key={month} value={String(i + 1)}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ano (opcional)"
                          min={1900}
                          max={new Date().getFullYear()}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

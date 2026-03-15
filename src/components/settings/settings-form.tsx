'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateSettings } from '@/lib/actions/settings';

const schema = z.object({
  churchName: z
    .string()
    .min(2, 'Nome da igreja deve ter pelo menos 2 caracteres'),
  departmentName: z
    .string()
    .min(2, 'Nome do departamento deve ter pelo menos 2 caracteres'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  defaultValues: FormValues;
}

export function SettingsForm({ defaultValues }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values: FormValues) {
    const result = await updateSettings(values);
    if (result.success) {
      toast.success('Configurações salvas!');
    } else {
      toast.error(result.error ?? 'Erro ao salvar configurações');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Church info */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Dados da Igreja
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Informações exibidas no sistema
            </p>
          </div>

          <FormField
            control={form.control}
            name="churchName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Igreja</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Igreja Batista Central" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Departamento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Departamento de Jovens" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? 'Salvando...'
              : 'Salvar Configurações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

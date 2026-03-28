import { z } from 'zod';

export const MONTHS = [
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

export const schema = z
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
      const hasYear = !!data.birthYear;
      if (hasYear && (!hasDay || !hasMonth)) return false;
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

export type FormValues = z.infer<typeof schema>;

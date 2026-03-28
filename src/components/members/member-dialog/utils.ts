import { formatPhone } from '@/lib/utils';
import type { FormValues } from './schema';

interface Member {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
}

export type { Member };

export function parseBirthDate(birthDate: string | null) {
  if (!birthDate) return { birthDay: '', birthMonth: '', birthYear: '' };
  const [yearStr, monthStr, dayStr] = birthDate.split('-');
  return {
    birthDay: dayStr ? String(Number(dayStr)) : '',
    birthMonth: monthStr ? String(Number(monthStr)) : '',
    birthYear: yearStr && yearStr !== '1900' ? yearStr : '',
  };
}

export function combineBirthDate(
  day: string,
  month: string,
  year: string,
): string {
  if (!day || !month) return '';
  const y = year || '1900';
  return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function memberDefaultValues(member?: Member): FormValues {
  return {
    name: member?.name ?? '',
    phone: member?.phone ? formatPhone(member.phone) : '',
    email: member?.email ?? '',
    ...parseBirthDate(member?.birthDate ?? null),
  };
}

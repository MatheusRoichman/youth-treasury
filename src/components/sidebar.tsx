import { Building2, Settings } from 'lucide-react';
import Link from 'next/link';
import { NavLinks } from '@/components/nav-links';
import { Separator } from '@/components/ui/separator';
import { getSettings } from '@/lib/db/settings';
import { hashColor } from '@/lib/utils';

export async function Sidebar() {
  const settings = await getSettings();
  const initials = settings.treasurerName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  const avatarColor = hashColor(settings.treasurerName);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-white">
      {/* App header */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-gray-900">
            Tesouraria Jovem
          </p>
          <p className="text-xs text-gray-400">Gestão Financeira</p>
        </div>
      </div>

      <Separator />

      {/* Church / department */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-gray-900">
              {settings.churchName}
            </p>
            <p className="truncate text-xs text-gray-400">
              {settings.departmentName}
            </p>
          </div>
        </div>
      </div>

      <NavLinks />

      <Separator />

      {/* Treasurer + Settings */}
      <div className="px-4 py-4 space-y-1">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {settings.treasurerName}
            </p>
            <p className="text-xs text-gray-400">Configurações</p>
          </div>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
      </div>
    </aside>
  );
}

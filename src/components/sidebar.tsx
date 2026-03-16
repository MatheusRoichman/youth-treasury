import { Church, Settings, UserCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { NavLinks } from '@/components/nav-links'
import { SidebarSignOut } from '@/components/sidebar-sign-out'
import { Separator } from '@/components/ui/separator'
import { getSettings } from '@/lib/db/settings'
import { createClient } from '@/lib/supabase/server'
import { hashColor } from '@/lib/utils'

export async function Sidebar() {
  const [settings, supabase] = await Promise.all([
    getSettings(),
    createClient(),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName = user?.user_metadata?.full_name as string | undefined
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName = fullName ?? user?.email ?? 'Usuário'

  const initials = fullName
    ? fullName
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase()

  const avatarBg = hashColor(displayName)

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-white">
      {/* App header */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Church className="h-5 w-5 text-white" />
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
            <Church className="h-4 w-4 text-primary" />
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

      {/* Bottom links */}
      <div className="px-4 py-2 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <UserCircle className="h-4 w-4" />
          Meu Perfil
        </Link>
      </div>

      <Separator />

      {/* User section */}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-gray-900">
              {displayName}
            </p>
            {fullName && (
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            )}
          </div>
        </div>
        <SidebarSignOut />
      </div>
    </aside>
  )
}

import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import {
  SidebarContainer,
  SidebarProvider,
  SidebarToggle,
} from '@/components/sidebar-container';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SidebarContainer>
          <Sidebar />
        </SidebarContainer>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
            <div className="flex items-center gap-3">
              <Image
                src="/img/logo.webp"
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg object-cover"
              />
              <div>
                <p className="text-sm font-bold leading-tight text-gray-900">
                  Tesouraria Jovem
                </p>
                <p className="text-xs text-gray-400">Gestão Financeira</p>
              </div>
            </div>
            <SidebarToggle />
          </div>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

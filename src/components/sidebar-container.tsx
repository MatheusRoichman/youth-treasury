'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}>({ isOpen: false, setIsOpen: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is used as a trigger to close the sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarToggle() {
  const { setIsOpen } = useContext(SidebarContext);
  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white md:hidden"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5 text-gray-600" />
    </button>
  );
}

export function SidebarContainer({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useContext(SidebarContext);

  return (
    <>
      {/* Backdrop — mobile only */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Fechar menu"
          tabIndex={-1}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, normal flow on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:inset-auto md:z-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </>
  );
}

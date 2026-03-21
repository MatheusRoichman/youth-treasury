'use client';

import { AlertTriangle } from 'lucide-react';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 p-6 font-sans antialiased">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900">Algo deu errado</h1>
            <p className="text-sm text-gray-500">
              Ocorreu um erro inesperado. Tente novamente ou entre em contato
              com o suporte.
            </p>
          </div>
          {error.digest && (
            <p className="text-xs text-gray-400">Código: {error.digest}</p>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}

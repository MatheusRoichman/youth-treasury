import { z } from 'zod';

// Safe to import in client and server components
export const clientEnv = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  })
  .parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

// Server-only — do not import from client components
export const serverEnv = z
  .object({
    DATABASE_URL: z.string().min(1),
  })
  .parse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

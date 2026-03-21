# Architecture — Tesouraria Jovem

## Folder structure

```
/app
  /login                    → Auth page, outside main layout
    layout.tsx              → Bare layout, no sidebar
    page.tsx                → Login form
  /(dashboard)              → Main app layout (sidebar + topbar)
    /                       → Painel de Controle (dashboard)
    /analytics              → Análises (read-only charts)
    /campaigns              → Lista de campanhas
    /campaigns/[id]         → Detalhe da campanha
    /transactions           → Histórico de transações
    /members                → Gestão de membros
    /profile                → Perfil do usuário

/components
  /ui                       → shadcn/ui primitives — never edit directly
  *.tsx                     → Composite components built from shadcn/ui

/lib
  /db                       → All Prisma queries — the ONLY layer that touches the DB
    analytics.ts
    campaigns.ts
    campaignMembers.ts
    members.ts
    transactions.ts
    settings.ts
  /actions                  → Next.js Server Actions — all mutations
    campaigns.ts
    campaignMembers.ts
    members.ts
    transactions.ts
    settings.ts
  /queries                  → TanStack Query key factories and prefetch functions
  /supabase
    client.ts               → Browser Supabase client (client components)
    server.ts               → Server Supabase client (server components + actions)
    middleware.ts            → Session refresh for middleware.ts

/prisma
  schema.prisma
  seed.ts

middleware.ts               → Protects all routes, redirects to /login if no session
```

## Layer rules — strictly enforced

1. **`/lib/db/`** — plain async functions, Prisma only. No HTTP, no business logic,
   no auth checks. Example: `getCampaignById(id: string)`.

2. **`/lib/actions/`** — Server Actions only. Each action:
   - Validates input with Zod
   - Calls one or more `/lib/db/` functions
   - Returns `{ success: boolean, data?: T, error?: string }`
   - Never puts Prisma calls inline

3. **`/lib/queries/`** — TanStack Query keys and query functions. Used to prefetch
   on the server and rehydrate on the client via `HydrationBoundary`.

4. **Server components** — fetch and prefetch data, wrap client trees in
   `HydrationBoundary`, pass dehydrated state down.

5. **Client components** — use `useQuery` and `useMutation`. Never fetch directly.
   Never import Prisma. Never call `/lib/db/` functions directly.

6. **`/components/ui/`** — shadcn/ui primitives. Never modified.

## Authentication flow

- `middleware.ts` calls `updateSession()` on every request
- Unauthenticated requests are redirected to `/login`
- Server components access the session via `createClient()` from `/lib/supabase/server.ts`
- Client components use `createClient()` from `/lib/supabase/client.ts`
- Sign out: `supabase.auth.signOut()` → redirect to `/login`

## Data flow — SSR + TanStack Query

```
Server Component
  → creates QueryClient
  → prefetchQuery (calls /lib/db/ functions)
  → dehydrate(queryClient)
  → passes state to <HydrationBoundary>
      → Client Component
          → useQuery (reads from cache, no extra fetch)
          → useMutation (calls Server Action)
              → Server Action (/lib/actions/)
                  → /lib/db/ function
                      → Prisma → Supabase PostgreSQL
```

## Supabase clients — when to use which

| Context | Import from |
|---|---|
| Client component | `/lib/supabase/client.ts` |
| Server component | `/lib/supabase/server.ts` |
| Server action | `/lib/supabase/server.ts` |
| middleware.ts | `/lib/supabase/middleware.ts` |

Never import the server client in a client component — it will throw at runtime.
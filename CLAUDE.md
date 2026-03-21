# Tesouraria Jovem — Claude Code Context

Private financial management app for a church youth department. Small fixed group
of users, no public registration, no role system. All authenticated users have
full access.

**Language:** All UI text in Brazilian Portuguese. Code and comments in English.

---

## Stack

Next.js App Router · Prisma 7 · Supabase (PostgreSQL + Auth + Storage) ·
Tailwind CSS · shadcn/ui · React Hook Form + Zod · TanStack Query · Recharts ·
Sonner · Vercel

---

## Architecture — strictly enforced

```
/lib/db/          → Prisma queries ONLY. No business logic, no HTTP, no auth.
/lib/actions/     → Server Actions ONLY. Validate with Zod, call /lib/db/, return { success, data?, error? }
/lib/queries/     → TanStack Query key factories and prefetch functions
/lib/supabase/
  client.ts       → Browser client — use in client components
  server.ts       → Server client — use in server components and server actions
  middleware.ts   → Session refresh — use in middleware.ts only
/components/ui/   → shadcn/ui primitives — never edit directly
```

**Rules:**
- Never put Prisma calls inside components or server actions directly — always go through `/lib/db/`
- Never import the server Supabase client in a client component
- Client components use `useQuery` / `useMutation` — never fetch directly
- Server components prefetch with `dehydrate(queryClient)` → pass to `<HydrationBoundary>`
- All server actions return `{ success: boolean, data?: T, error?: string }`

---

## Data model — key facts

**Transaction** is the single source of truth for all amounts. Never store computed values.

**Derived at query time — never stored:**
```ts
// Per CampaignMember
paidAmount = SUM(transactions WHERE memberId = X AND campaignId = Y AND type = CONTRIBUTION)
status = isExempt ? EXEMPT : paidAmount === 0 ? PENDING : paidAmount < expectedAmount ? PARTIAL : PAID

// Balances
totalBalance    = SUM(CONTRIBUTION) - SUM(EXPENSE)                          // all transactions
campaignBalance = SUM(CONTRIBUTION) - SUM(EXPENSE) WHERE campaignId IS NOT NULL
generalBalance  = SUM(CONTRIBUTION) - SUM(EXPENSE) WHERE campaignId IS NULL
campaignTotal   = SUM(CONTRIBUTION WHERE campaignId = X)                    // progress bar
```

**Transaction fields:**
- `memberId` — set for member contributions, null otherwise
- `donorName` — set for external/anonymous donations
- `vendorName` — set for expenses
- `campaignId` — optional for all types; null = goes to general balance only

**Member initials** — always derived, never manually entered:
```ts
const words = name.trim().split(' ').filter(Boolean)
const initials = words.length === 1
  ? words[0].slice(0, 2).toUpperCase()
  : (words[0][0] + words[words.length - 1][0]).toUpperCase()
```

**Avatar color:** `hsl(charCodeSum % 360, 60%, 50%)` derived from name.

---

## Business rules — enforced in server actions

| Rule | Action |
|---|---|
| Only one ACTIVE `MONTHLY_FEE` campaign at a time | `createCampaignAction` |
| Cannot add members to `MONTHLY_FEE` campaign after creation | `addMemberToCampaignAction` |
| Member must have a `CampaignMember` row before contributing to a campaign — if missing, set `campaignId = null` (do not reject) | `createTransactionAction` |
| Exemption requires `exemptionCategory` + `exemptionReason` (min 10, max 300 chars) | `setMemberExemptAction` |
| Transaction `date` cannot be in the future | `createTransactionAction` + Zod |
| `amount` must be > 0, max 2 decimal places | All transaction actions |
| If `type = EXPENSE`: `memberId` and `donorName` must be null | `createTransactionAction` |

**Campaign creation logic:**
- `MONTHLY_FEE`: treasurer sets `expectedAmount` per member → `goalAmount = expectedAmount × memberCount` (readonly)
- `FUNDRAISER`: treasurer sets `goalAmount` → `expectedAmount = goalAmount / memberCount` (readonly, if members selected)

---

## Formatting conventions

```ts
// Currency
Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
// → R$ 1.250,00

// Dates
Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
// → 05 abr. 2024

// Transactions ordering — always, everywhere, no exceptions
orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
```

---

## UI conventions

- Toasts (Sonner) on every mutation success and error
- Auth errors (login) use inline text — not toast
- Skeletons on all `useQuery` components while `isLoading`
- Empty states with action button on all tables and lists
- Loading state on all submit buttons while in flight
- `max={new Date().toISOString().split('T')[0]}` on all date inputs for transactions

---

## Security

- Middleware blocks all unauthenticated requests — redirects to `/login`
- RLS enabled on all tables — authenticated users have full access
- Supabase Storage bucket `avatars` — public read, authenticated write
- Avatar URL always includes `?t=${Date.now()}` for cache busting
- No registration page, no password reset, no email confirmation, no OAuth

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL        → Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Supabase anon key
DATABASE_URL                    → Transaction pooler, port 6543, ?pgbouncer=true
DIRECT_URL                      → Direct connection, port 5432
```

---

## What NOT to do

- Do not put Prisma in components or server actions directly
- Do not store `paidAmount`, `status`, `balance`, or any computed value in the DB
- Do not add registration, password reset, or email confirmation flows
- Do not add a role system
- Do not change transaction ordering
- Do not allow future-dated transactions
- Do not use `localStorage` or `sessionStorage`
- Do not rebuild what already exists — only change what is explicitly requested

---

## Reference docs

Detailed documentation is in `/AI/`:
- `PROJECT.md` — full stack, deployment, constraints
- `ARCHITECTURE.md` — folder structure, layer rules, data flow
- `DATA_MODEL.md` — all models, relationships, enums, derived formulas
- `BUSINESS_RULES.md` — all rules with enforcement location
- `AI_USAGE.md` — prompt templates and context guide
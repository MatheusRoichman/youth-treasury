# AI Usage Guide — Tesouraria Jovem

This file explains how to work effectively with AI tools on this project.
Always provide relevant context files alongside your request.

---

## Context files to include

Depending on the task, attach the relevant files to give the AI full context:

| Task | Files to include |
|---|---|
| Any task | `AI/PROJECT.md` |
| New feature or screen | `PROJECT.md` + `ARCHITECTURE.md` + `DATA_MODEL.md` + `BUSINESS_RULES.md` |
| Bug fix | `ARCHITECTURE.md` + the specific file with the bug |
| New server action | `ARCHITECTURE.md` + `BUSINESS_RULES.md` + `/lib/actions/` relevant file |
| New DB query | `DATA_MODEL.md` + `/lib/db/` relevant file |
| UI component | `ARCHITECTURE.md` + the relevant page/component file |
| Schema change | `DATA_MODEL.md` + `BUSINESS_RULES.md` + `prisma/schema.prisma` |
| Analytics query | `DATA_MODEL.md` + `/lib/db/analytics.ts` |

---

## Prompt structure that works well

```
[What you want]
[What already exists / current behavior]
[What should change]
[Any constraints]
```

Example:
> Add a "Reabrir campanha" button to the campaign detail page that sets status back
> to ACTIVE. The button should only appear when status is CLOSED, not ARCHIVED.
> Validate in the server action that the campaign is not MONTHLY_FEE type if another
> MONTHLY_FEE campaign is already ACTIVE. Return { success, error? }.

---

## Rules to always include in prompts

Add this block to any prompt that involves writing code:

```
Follow the project architecture strictly:
- All Prisma queries go in /lib/db/ only
- All mutations go through Server Actions in /lib/actions/
- Server Actions validate with Zod and return { success, data?, error? }
- Client components use useQuery/useMutation — never fetch directly
- Use HydrationBoundary + dehydrate for SSR data passing
- All UI text in Brazilian Portuguese
- Currency: Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
- Dates: Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
- Toasts via Sonner on every mutation success and error
- Skeletons on all useQuery components while isLoading
- Transactions always ordered [{ date: 'desc' }, { createdAt: 'desc' }]
```

---

## What to tell the AI NOT to do

Include this when relevant to avoid common mistakes:

```
Do not:
- Put Prisma calls inside components or server actions directly
- Use localStorage or sessionStorage
- Add a registration or password reset flow
- Add a role system
- Store computed values (paidAmount, status, balance) in the database
- Change the transaction ordering
- Allow future-dated transactions
- Rebuild what already exists — only change what is described
```

---

## Common tasks — ready-made prompts

### Add a new field to an existing model

```
Add [field name] to the [Model] model in prisma/schema.prisma.
Run prisma migrate dev --name add_[field]_to_[model].
Update the relevant /lib/db/ query to include the field.
Update the relevant form in [page] with a new [input type] field.
Validate with Zod: [validation rules].
Follow the project architecture in ARCHITECTURE.md.
Do not rebuild anything else.
```

### Add a new screen

```
Build a new page at /[route] for [purpose].
Server component prefetches [data] using HydrationBoundary.
[Describe the layout and content].
Add "[Label]" to the sidebar nav pointing to /[route].
Follow the project architecture in ARCHITECTURE.md and business rules in BUSINESS_RULES.md.
All UI text in Brazilian Portuguese.
```

### Fix a bug

```
Bug: [describe what happens]
Expected: [describe what should happen]
Relevant file: [file path]
Do not change anything outside this file unless strictly necessary.
```

### Add a new server action

```
Create [actionName] in /lib/actions/[file].ts.
It should [describe what it does].
Zod validation: [list fields and rules].
Call [dbFunction] from /lib/db/[file].ts (create it if it doesn't exist).
Return { success, data?, error? }.
Business rules to enforce: [list from BUSINESS_RULES.md].
```

---

## Environment

```
Node.js 18+
Next.js App Router
Prisma 7
@supabase/ssr for auth
Vercel deployment
Database: Supabase PostgreSQL (Transaction pooler on port 6543 for DATABASE_URL)
```

## Never commit

```
.env.local
```

Contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`DATABASE_URL`, and `DIRECT_URL`.
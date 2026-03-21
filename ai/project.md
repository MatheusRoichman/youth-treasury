# Project Overview — Tesouraria Jovem

## What this is

Tesouraria Jovem is a private, internal financial management web application for a
church youth department. It is used exclusively by the department treasurer and a
small number of trusted users to track campaigns, member contributions, expenses,
and the department's overall financial health.

## Who uses it

A small, fixed group of users managed manually by the system owner. There is no
public registration. All users are created via the Supabase dashboard. All
authenticated users have full access — there is no role system.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, SSR-first) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Auth | Supabase Auth + @supabase/ssr |
| Storage | Supabase Storage (avatars bucket) |
| Styling | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| Client queries | TanStack Query (React Query) with SSR hydration |
| Charts | Recharts |
| Toasts | Sonner |
| Deployment | Vercel |
| Domain | dev.treasury.roichman.dev |

## Language

All UI text is in Brazilian Portuguese. All code, comments, and technical
documentation are in English.

## Key constraints

- No public registration, no password reset flow, no email confirmation
- No role system — authenticated = full access
- Future-dated transactions are not allowed
- All monetary values are in BRL, formatted as `R$ X.XXX,XX`
- All dates formatted as `DD Mmm YYYY` (e.g. "05 abr. 2024")
- Member avatars stored in Supabase Storage bucket `avatars` (public)
- Avatar URL includes a cache-busting `?t=timestamp` query param
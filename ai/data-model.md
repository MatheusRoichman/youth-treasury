# Data Model — Tesouraria Jovem

## Entity relationships

```
Member ──< CampaignMember >── Campaign
Member ──< Transaction
Campaign ──< Transaction (optional)
```

## Models

### Settings
Singleton row (`id = "singleton"`). Stores display info only.
- `churchName` — shown in the topbar
- `departmentName` — shown in the sidebar subtitle

### Member
Registered youth department member.
- `initials` — derived from name on insert (first letter of first + last word, uppercased)
- `status` — `ACTIVE` | `INACTIVE`
- Inactive members are excluded from campaign auto-assignment

### Campaign
Any fundraising effort — monthly fee or general fundraiser.
- `type` — `MONTHLY_FEE` | `FUNDRAISER`
- `status` — `ACTIVE` | `CLOSED` | `ARCHIVED`
- `goalAmount` — target amount to raise
- Only one `MONTHLY_FEE` campaign can be `ACTIVE` at a time (enforced in server action)

**Creation flow by type:**

`MONTHLY_FEE`:
- Treasurer inputs: member selection + expected amount per member
- System calculates: `goalAmount = expectedAmount × memberCount` (readonly)
- On confirm: creates Campaign + one CampaignMember per selected member
- Members cannot be added after creation

`FUNDRAISER`:
- Treasurer inputs: goal amount + optional member selection
- System calculates: `expectedAmount = goalAmount / memberCount` (readonly, if members selected)
- Members can be added after creation

### CampaignMember
Assignment of a member to a campaign. Required before a member can contribute.
- `expectedAmount` — what the treasurer expects them to pay
- `isExempt` — excludes member from goal calculations
- `exemptionCategory` — required when isExempt = true
- `exemptionReason` — required when isExempt = true (min 10, max 300 chars)

**Status is always derived at query time — never stored:**
```
paidAmount = SUM(transactions WHERE memberId = X AND campaignId = Y AND type = CONTRIBUTION)

status =
  if isExempt                      → EXEMPT
  elif paidAmount = 0              → PENDING
  elif paidAmount < expectedAmount → PARTIAL
  else                             → PAID
```

### Transaction
Single source of truth for all financial amounts. Every money movement is a row here.

| Scenario | memberId | donorName | vendorName | campaignId |
|---|---|---|---|---|
| Member contribution | set | null | null | optional |
| External donation | null | set (or null=anonymous) | null | optional |
| Expense | null | null | optional | optional |

- `campaignId` is optional for all types — when null, transaction goes to general balance only
- `date` cannot be in the future (validated in Zod + `max` on date input)
- Always ordered by `[{ date: 'desc' }, { createdAt: 'desc' }]`

**Enums:**
```
TransactionType:     CONTRIBUTION | EXPENSE
TransactionCategory: MONTHLY_FEE | OFFERING | TITHE | EXPENSE | OTHER
ExemptionCategory:   FINANCIAL_HARDSHIP | HEALTH | TRAVEL | UNEMPLOYMENT | OTHER
MemberStatus:        ACTIVE | INACTIVE
CampaignType:        MONTHLY_FEE | FUNDRAISER
CampaignStatus:      ACTIVE | CLOSED | ARCHIVED
```

## Derived values — never stored, always computed

```
// General balance (all-time)
totalBalance = SUM(CONTRIBUTION transactions) - SUM(EXPENSE transactions)

// Campaign breakdown
campaignBalance = SUM(transactions WHERE campaignId IS NOT NULL AND type=CONTRIBUTION)
               - SUM(transactions WHERE campaignId IS NOT NULL AND type=EXPENSE)
generalBalance  = SUM(transactions WHERE campaignId IS NULL AND type=CONTRIBUTION)
               - SUM(transactions WHERE campaignId IS NULL AND type=EXPENSE)
// Always true: campaignBalance + generalBalance = totalBalance

// Campaign progress
campaignTotal = SUM(transactions WHERE campaignId = X AND type = CONTRIBUTION)

// Campaign net balance (shown on campaign detail page)
campaignNetBalance = SUM(CONTRIBUTION for campaign) - SUM(EXPENSE for campaign)

// Per CampaignMember
paidAmount = SUM(transactions WHERE memberId = X AND campaignId = Y AND type = CONTRIBUTION)
```

## Security

- RLS enabled on all tables: `members`, `campaigns`, `campaign_members`, `transactions`, `settings`
- Policy: authenticated users have full access (`FOR ALL TO authenticated USING (true)`)
- Supabase Storage bucket `avatars`: public read, authenticated write
- Middleware blocks all unauthenticated requests at the Next.js layer
-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('MONTHLY_FEE', 'FUNDRAISER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CONTRIBUTION', 'EXPENSE');

-- CreateEnum
CREATE TYPE "ExemptionCategory" AS ENUM ('FINANCIAL_HARDSHIP', 'HEALTH', 'TRAVEL', 'UNEMPLOYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('MONTHLY_FEE', 'OFFERING', 'EXPENSE', 'OTHER');

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "church_name" TEXT NOT NULL,
    "department_name" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "goal_amount" DECIMAL(10,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_members" (
    "id" TEXT NOT NULL,
    "expected_amount" DECIMAL(10,2) NOT NULL,
    "is_exempt" BOOLEAN NOT NULL DEFAULT false,
    "exemption_reason" TEXT,
    "exemption_category" "ExemptionCategory",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaign_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "member_id" TEXT,
    "donor_name" TEXT,
    "vendor_name" TEXT,
    "campaign_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_members_campaign_id_member_id_key" ON "campaign_members"("campaign_id", "member_id");

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'PAID', 'EXEMPT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CONTRIBUTION', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('MONTHLY_FEE', 'OFFERING', 'EXPENSE', 'OTHER');

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
CREATE TABLE "monthly_cycles" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "goal_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "member_id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "vendor_name" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "member_id" TEXT,
    "cycle_id" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "churchName" TEXT NOT NULL DEFAULT 'Igreja Youth',
    "departmentName" TEXT NOT NULL DEFAULT 'Departamento de Jovens',
    "treasurerName" TEXT NOT NULL DEFAULT 'Tesoureiro',
    "member_contribution_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_cycles_month_year_key" ON "monthly_cycles"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "contributions_member_id_cycle_id_key" ON "contributions"("member_id", "cycle_id");

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "monthly_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "monthly_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

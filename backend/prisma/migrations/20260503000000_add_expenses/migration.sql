CREATE TABLE IF NOT EXISTS "Expense" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "ExpenseCategory" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "method" "PaymentMethod",
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Expense" ADD CONSTRAINT IF NOT EXISTS "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

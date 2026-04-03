export interface InvestorEquityCalculationInput {
  fundingGoal?: number | string | null;
  pledgeAmount?: number | string | null;
  amountInvested?: number | string | null;
}

const normalizeNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateInvestorEquity = ({
  fundingGoal,
  pledgeAmount,
  amountInvested,
}: InvestorEquityCalculationInput) => {
  const normalizedFundingGoal = normalizeNumber(fundingGoal);
  if (normalizedFundingGoal <= 0) return 0;

  const normalizedPledgeAmount = normalizeNumber(pledgeAmount);
  const normalizedAmountInvested = normalizeNumber(amountInvested);
  const baseAmount = normalizedPledgeAmount > 0 ? normalizedPledgeAmount : normalizedAmountInvested;

  if (baseAmount <= 0) return 0;

  return Math.round((baseAmount / normalizedFundingGoal) * 10000) / 100;
};

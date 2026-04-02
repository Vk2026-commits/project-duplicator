export interface Investor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  totalInvested: number;
  portfolioValue: number;
  startups: number;
  joinDate: string;
  status: "active" | "inactive";
}

export interface Startup {
  id: string;
  name: string;
  sector: string;
  stage: "Pre-Seed" | "Seed" | "Series A" | "Series B" | "Series C";
  invested: number;
  currentValue: number;
  progress: number;
  status: "on-track" | "at-risk" | "outperforming";
  founded: string;
  description: string;
  investorIds: string[];
}

export interface Investment {
  id: string;
  investorId: string;
  startupId: string;
  amount: number;
  date: string;
  equity: number;
}

export const investors: Investor[] = [
  { id: "inv-1", name: "Sarah Chen", email: "sarah@capital.vc", avatar: "SC", totalInvested: 2500000, portfolioValue: 4200000, startups: 5, joinDate: "2023-01-15", status: "active" },
  { id: "inv-2", name: "Marcus Johnson", email: "marcus@ventures.io", avatar: "MJ", totalInvested: 1800000, portfolioValue: 2900000, startups: 3, joinDate: "2023-03-22", status: "active" },
  { id: "inv-3", name: "Elena Rodriguez", email: "elena@invest.co", avatar: "ER", totalInvested: 3200000, portfolioValue: 5100000, startups: 7, joinDate: "2022-11-08", status: "active" },
  { id: "inv-4", name: "David Kim", email: "david@fund.vc", avatar: "DK", totalInvested: 950000, portfolioValue: 1100000, startups: 2, joinDate: "2023-07-01", status: "active" },
  { id: "inv-5", name: "Aisha Patel", email: "aisha@growth.vc", avatar: "AP", totalInvested: 4100000, portfolioValue: 7200000, startups: 8, joinDate: "2022-06-15", status: "active" },
];

export const startups: Startup[] = [
  { id: "st-1", name: "NeuralFlow AI", sector: "Artificial Intelligence", stage: "Series A", invested: 1200000, currentValue: 3500000, progress: 78, status: "outperforming", founded: "2022-03", description: "Enterprise AI platform for workflow automation", investorIds: ["inv-1", "inv-3", "inv-5"] },
  { id: "st-2", name: "GreenGrid Energy", sector: "CleanTech", stage: "Seed", invested: 600000, currentValue: 900000, progress: 55, status: "on-track", founded: "2023-01", description: "Smart grid optimization for renewable energy", investorIds: ["inv-1", "inv-2"] },
  { id: "st-3", name: "MediSync Health", sector: "HealthTech", stage: "Series B", invested: 2800000, currentValue: 5200000, progress: 82, status: "outperforming", founded: "2021-06", description: "AI-driven patient data synchronization platform", investorIds: ["inv-3", "inv-5"] },
  { id: "st-4", name: "QuantumLedger", sector: "FinTech", stage: "Pre-Seed", invested: 350000, currentValue: 280000, progress: 32, status: "at-risk", founded: "2023-09", description: "Quantum-resistant blockchain for financial transactions", investorIds: ["inv-2", "inv-4"] },
  { id: "st-5", name: "CropWise Agri", sector: "AgriTech", stage: "Seed", invested: 500000, currentValue: 750000, progress: 60, status: "on-track", founded: "2023-04", description: "Precision agriculture using satellite imagery and ML", investorIds: ["inv-1", "inv-4", "inv-5"] },
  { id: "st-6", name: "EduVerse", sector: "EdTech", stage: "Series A", invested: 1500000, currentValue: 2100000, progress: 45, status: "on-track", founded: "2022-08", description: "Immersive VR learning environments for K-12", investorIds: ["inv-3", "inv-5"] },
  { id: "st-7", name: "SecureNest", sector: "CyberSecurity", stage: "Series A", invested: 1800000, currentValue: 3000000, progress: 70, status: "outperforming", founded: "2022-01", description: "Zero-trust security platform for SMBs", investorIds: ["inv-2", "inv-3", "inv-5"] },
];

export const investments: Investment[] = [
  { id: "i-1", investorId: "inv-1", startupId: "st-1", amount: 400000, date: "2023-02-15", equity: 2.5 },
  { id: "i-2", investorId: "inv-1", startupId: "st-2", amount: 300000, date: "2023-04-10", equity: 5.0 },
  { id: "i-3", investorId: "inv-1", startupId: "st-5", amount: 200000, date: "2023-06-01", equity: 4.0 },
  { id: "i-4", investorId: "inv-2", startupId: "st-2", amount: 300000, date: "2023-04-10", equity: 5.0 },
  { id: "i-5", investorId: "inv-2", startupId: "st-4", amount: 150000, date: "2023-10-01", equity: 3.0 },
  { id: "i-6", investorId: "inv-2", startupId: "st-7", amount: 600000, date: "2023-03-15", equity: 3.5 },
  { id: "i-7", investorId: "inv-3", startupId: "st-1", amount: 400000, date: "2023-02-15", equity: 2.5 },
  { id: "i-8", investorId: "inv-3", startupId: "st-3", amount: 1000000, date: "2022-09-01", equity: 4.0 },
  { id: "i-9", investorId: "inv-3", startupId: "st-6", amount: 500000, date: "2023-01-15", equity: 3.0 },
  { id: "i-10", investorId: "inv-3", startupId: "st-7", amount: 600000, date: "2023-03-15", equity: 3.5 },
  { id: "i-11", investorId: "inv-4", startupId: "st-4", amount: 200000, date: "2023-10-01", equity: 4.0 },
  { id: "i-12", investorId: "inv-4", startupId: "st-5", amount: 150000, date: "2023-06-01", equity: 3.0 },
  { id: "i-13", investorId: "inv-5", startupId: "st-1", amount: 400000, date: "2023-02-15", equity: 2.5 },
  { id: "i-14", investorId: "inv-5", startupId: "st-3", amount: 1800000, date: "2022-09-01", equity: 7.0 },
  { id: "i-15", investorId: "inv-5", startupId: "st-5", amount: 150000, date: "2023-06-01", equity: 3.0 },
  { id: "i-16", investorId: "inv-5", startupId: "st-6", amount: 1000000, date: "2023-01-15", equity: 6.0 },
  { id: "i-17", investorId: "inv-5", startupId: "st-7", amount: 600000, date: "2023-03-15", equity: 3.5 },
];

export const monthlyReturns = [
  { month: "Jul", value: 8200000 },
  { month: "Aug", value: 8800000 },
  { month: "Sep", value: 9100000 },
  { month: "Oct", value: 8900000 },
  { month: "Nov", value: 9600000 },
  { month: "Dec", value: 10200000 },
  { month: "Jan", value: 10800000 },
  { month: "Feb", value: 11500000 },
  { month: "Mar", value: 12100000 },
];

export const sectorAllocation = [
  { sector: "AI", value: 35 },
  { sector: "HealthTech", value: 22 },
  { sector: "FinTech", value: 12 },
  { sector: "CleanTech", value: 10 },
  { sector: "CyberSec", value: 12 },
  { sector: "Other", value: 9 },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

import { LabDashboard } from "@/components/lab/LabDashboard";

export const metadata = {
  title: "Account Lab — Zoxdi",
  description:
    "Write your own transactions and watch the T-accounts, trial balance, income statement and balance sheet update live — all on one screen.",
};

export default function LabPage() {
  return <LabDashboard />;
}

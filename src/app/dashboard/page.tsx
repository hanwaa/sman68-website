import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth-server";
import DashboardView from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const account = await getSessionAccount();

  if (!account) {
    redirect("/login?next=%2Fdashboard");
  }

  return <DashboardView account={account} />;
}

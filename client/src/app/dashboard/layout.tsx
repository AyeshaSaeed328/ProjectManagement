

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardWrapper from "@/app/dashboardWrapper";
import { attemptTokenRefresh } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  // console.log("cookie", accessToken)

  if (!accessToken) {
    const refreshed = await attemptTokenRefresh();
    if (!refreshed) {
      redirect("/login");
    }
  }

  return <DashboardWrapper>{children}</DashboardWrapper>;
}


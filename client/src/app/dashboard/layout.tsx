import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardWrapper from "@/app/dashboardWrapper";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login");
  }

  return <DashboardWrapper>{children}</DashboardWrapper>;
}

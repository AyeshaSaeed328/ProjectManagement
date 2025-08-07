import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { attemptTokenRefresh } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies(); // Get cookie store
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    const refreshed = await attemptTokenRefresh();

    console.log("Token refreshed:", refreshed);

    if (!refreshed) {
      redirect("/login");
    }
  }

  redirect("/dashboard");
}

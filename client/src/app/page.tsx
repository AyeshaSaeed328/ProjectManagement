import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { attemptTokenRefresh } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    
  
    if (!accessToken) {
      const refreshed = await attemptTokenRefresh();
      if (!refreshed) {
        redirect("/login");
      }
      else{
        redirect("/dashboard")
      }
    }
}

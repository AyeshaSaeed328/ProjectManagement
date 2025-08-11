import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { attemptTokenRefresh } from "@/lib/auth";

export default async function Home() {
  

  redirect("/dashboard");
}

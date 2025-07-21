// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value;

  if (token) {
    redirect("/");
  } else {
    redirect("/login");
  }
}

export async function attemptTokenRefresh() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/refresh-token`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Token refresh failed");
    return true;
  } catch {
    return false;
  }
}

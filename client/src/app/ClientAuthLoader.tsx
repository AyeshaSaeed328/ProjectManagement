// app/components/ClientAuthLoader.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/app/redux";
import { setAuthUser, clearAuth, setAuthLoading } from "@/state";
import { useGetAuthUserQuery } from "@/state/api";

export default function ClientAuthLoader() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data, isError, isLoading } = useGetAuthUserQuery(undefined, {
    skip: false,
    refetchOnFocus: false,
  });

  useEffect(() => {
    dispatch(setAuthLoading(true));

    if (!isLoading) {
      if (data) {
        dispatch(setAuthUser(data.data));
      } else if (isError) {
        dispatch(clearAuth());
        router.push("/login");
      }
      dispatch(setAuthLoading(false));
    }
  }, [data, isError, isLoading, dispatch, router]);

  return null;
}

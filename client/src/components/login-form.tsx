

'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginSchema} from "@/schemas/loginSchema"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginUserMutation, useForgotPasswordMutation, useResetPasswordMutation } from "@/state/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppDispatch } from "@/app/redux";
import { setAuthLoading, setAuthUser, clearAuth } from "@/state";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [loginUser] = useLoginUserMutation();
  const [sendForgotPassword] = useForgotPasswordMutation();
  const [formError, setFormError] = useState<string | null>(null);

 const onSubmit = async (data: LoginSchema) => {
  setFormError(null);
  dispatch(setAuthLoading(true))

  try {

    const res = await loginUser(data).unwrap();
    const user = res.user
    dispatch(setAuthUser(user))

    // const user = response.data?.user;
    // console.log("aaaa")
    // console.log(user)
    if (!user) {
      setFormError("User data missing in response");
      return;
    }

    if (!user?.isEmailVerified) {
      router.push("/verify-email");
    } else {
      router.push("/dashboard");
    }
  } catch (error: any) {
    dispatch(clearAuth())
    // console.error("Login error:", error);

    const status = error?.status;
    const message = error?.data?.message || "An unknown error occurred.";

    if (status === 404) {
      setFormError("User does not exist.");
    } else if (status === 403) {
      setFormError("Invalid credentials.");
    } else if (status === 400) {
      setFormError(message);
    } else {
      setFormError("Something went wrong. Please try again.");
    }
  }
};



  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/google`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      {formError && (
        <div className="text-red-500 text-sm text-center">
          {formError}
        </div>
      )}
      

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="m@example.com"
            aria-invalid={!!errors.email}
            className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            {...register("password")}
  aria-invalid={!!errors.password}
  className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>

        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>

        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="mr-2 h-5 w-5"
          >
            <path
              fill="currentColor"
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            />
          </svg>
          Login with Google
        </Button>
      </div>


<div className="text-center text-sm">
  Don&apos;t have an account?{" "}
  <Link href="/signup" className="underline underline-offset-4">
    Sign up
  </Link>
</div>

    </form>
  );
}

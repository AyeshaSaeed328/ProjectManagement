"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegisterUserMutation } from "@/state/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {signUpSchema, SignUpSchema } from "@/schemas/signUpSchema"
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch } from "@/app/redux";
import { setAuthLoading, setAuthUser, clearAuth } from "@/state";



export default function SignForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });
  const [registerUser] = useRegisterUserMutation();
  const dispatch = useAppDispatch();

  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter()

  const onSubmit = async (data: SignUpSchema) => {
  setFormError(null);
  dispatch(setAuthLoading(true))
  try {
    const res = await registerUser(data).unwrap(); // unwrap gives you direct access to the result or throws error
    
    
    console.log("User registered:", res);
    
    const user = res.data.user

    dispatch(setAuthUser(user))
    router.push("/verify-email");
  } catch (err: any) {

    const errorMessage =
      err?.data?.message || err?.error || "Something went wrong. Please try again.";
      dispatch(clearAuth())
    setFormError(errorMessage);
  }
};
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-3xl">Register</CardTitle>
        <CardDescription>Enter your information to create an account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...register("username")
              
            } 
            placeholder="username"
            aria-invalid={!!errors.username}
            className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}/>
            {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")}
            placeholder="m@example.com"
            aria-invalid={!!errors.email}
            className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} 
            aria-invalid={!!errors.password}
            className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}/>
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
            className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""} />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

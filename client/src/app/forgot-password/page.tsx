'use client';

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForgotPasswordMutation } from "@/state/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";


const emailSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
});

type EmailSchema = z.infer<typeof emailSchema>;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [sendVerification] = useForgotPasswordMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailSchema>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailSchema) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      await sendVerification(data).unwrap();
      setSuccessMessage("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      const message =
        error?.data?.message || "Something went wrong. Please try again.";
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-md rounded-xl w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-center mb-4">Verify Your Email</h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          Enter your email address and we’ll send you a verification link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
          {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Sending...
              </>
            ) : (
              "Send Verification Email"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already verified?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:underline"
          >
            Go to Login
          </button>
        </p>
      </div>
    </div>
  );
}

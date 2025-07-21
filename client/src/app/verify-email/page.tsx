/**
 * v0 by Vercel.
 * @see https://v0.dev/t/Z1T4sBByHVA
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function VerifyEmail() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-12 px-4 sm:px-6 lg:px-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Verify your email</h1>
        <p className="text-gray-500 dark:text-gray-400">
          We've sent a verification code to your email address. Enter the code below to confirm your identity.
        </p>
      </div>
      <form className="space-y-4">
        <div>
          <Label htmlFor="verification-code">Verification Code</Label>
          <Input id="verification-code" type="text" placeholder="Enter 6-digit code" maxLength={6} required />
        </div>
        <Button type="submit" className="w-full">
          Verify Email
        </Button>
      </form>
    </div>
  )
}
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, ToasterProps } from "sonner"
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const icons = {
  success: <CheckCircle className="text-green-500" size={18} />,
  error: <XCircle className="text-red-500" size={18} />,
  warning: <AlertTriangle className="text-yellow-500" size={18} />,
  info: <Info className="text-blue-500" size={18} />,
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "rounded-xl border bg-background text-foreground shadow-md",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton: "bg-muted text-foreground hover:bg-muted/80",
        },
        unstyled: false,
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, toast, icons }

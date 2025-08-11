'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EllipsisVerticalIcon } from "lucide-react"
import { useLeaveGroupChatMutation } from "@/state/api"

export function GroupChatDropdown({
  onOpenGroupDetails,
  chatId,
}: {
  onOpenGroupDetails: () => void
  chatId: string
}) {
  const [leaveGroupChat] = useLeaveGroupChatMutation()
  const [open, setOpen] = useState(false)

  const handleLeaveGroup = async () => {
    try {
      await leaveGroupChat({ chatId }).unwrap()
      setOpen(false) // close dialog after success
    } catch (error) {
      console.error("Failed to leave group chat:", error)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56 dark:bg-dark-bg">
          <DropdownMenuItem onClick={onOpenGroupDetails}>
            Details
          </DropdownMenuItem>

          {/* This will open the AlertDialog */}
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Exit Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AlertDialog Confirmation */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You won’t be able to
              send or receive messages unless you are re-added.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "@/state/api";
import { useState } from "react";


interface AddParticipantsModalProps {
  open: boolean;
  onClose: () => void;
  allUsers: User[];
  currentParticipants: User[];
  onConfirm: (selectedIds: string[]) => void;
}

export const AddParticipantsModal: React.FC<AddParticipantsModalProps> = ({
  open,
  onClose,
  allUsers,
  currentParticipants,
  onConfirm
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const availableUsers = allUsers.filter(
    u => !currentParticipants.some(p => p.id === u.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md dark:bg-dark-bg">
        <DialogHeader>
          <DialogTitle>Select Users to Add</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {availableUsers.length === 0 && (
            <p className="text-sm text-muted-foreground">No users available to add.</p>
          )}
          {availableUsers.map(user => (
            <div key={user.id} className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.includes(user.id)}
                onCheckedChange={() => toggleSelection(user.id)}
              />
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profilePicture || ""} />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>{user.username}</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(selectedIds);
              setSelectedIds([]);
              onClose();
            }}
            disabled={selectedIds.length === 0}
          >
            Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

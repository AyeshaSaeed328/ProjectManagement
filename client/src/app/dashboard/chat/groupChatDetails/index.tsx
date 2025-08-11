import React, { useState } from "react";
import { ChatInterface, User, api } from "@/state/api";
import { ArrowLeft, Camera, UserPlus, UserMinus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useRenameGroupChatMutation, useAddUserToGroupChatMutation, useRemoveUserFromGroupChatMutation, useGetAllUsersQuery } from "@/state/api";
import {AddParticipantsModal} from "@/(components)/AddParticipantsModal";

interface GroupChatDetailsProps {
  chat: ChatInterface;
  onBack: () => void;
  refetchChats: () => void
}

const GroupChatDetails = ({
  chat,
  onBack,
  refetchChats
}: GroupChatDetailsProps) => {
  const [groupName, setGroupName] = useState(chat.name);
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);


  const [renameGroupChat, { isLoading: isRenaming }] = useRenameGroupChatMutation();
  const [addUserToGroupChat, { isLoading: isAdding }] = useAddUserToGroupChatMutation();
  const [removeUserFromGroupChat, { isLoading: isRemoving }] = useRemoveUserFromGroupChatMutation();
  const { data: res} = useGetAllUsersQuery();
  const allUsers = res?.data || [];



  const handleRename = async () => {
    if (!chat?.id) {
    console.error("No chat ID available");
    return;
  }
    if (groupName.trim() === "") return;
    try {
      
      await renameGroupChat({ chatId: chat.id, name: groupName }).unwrap();
 
      
    } catch (error) {
      console.error("Failed to rename group chat:", error);
    }
  };
   const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGroupPhoto(e.target.files[0]);
    }
  };

  const handleAddParticipantsConfirm = async (userIds: string[]) => {
  try {
    await addUserToGroupChat({
      chatId: chat.id,
      participantIds: userIds
    }).unwrap();

  } catch (error) {
    console.error("Failed to add participants:", error);
  }
};


const handleRemoveParticipant = async (userId: string) => {
  try {
    await removeUserFromGroupChat({ chatId: chat.id, participantId: userId }).unwrap();

    
  } catch (error) {
    console.error("Failed to remove participant:", error);
  }
};



  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-bg dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b dark:bg-dark-secondary">
      <div className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">Group Details</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleRename} >
          <Save className="w-4 h-4" />
          Save
        </Button>
        </div>
      </div>

      {/* Group Photo + Name */}
      <div className="flex flex-col items-center gap-4 py-6 border-b">
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage
              src={groupPhoto || ""}
              alt="Group"
            />
            <AvatarFallback>{chat.name?.charAt(0) || "G"}</AvatarFallback>
          </Avatar>
          <label
            htmlFor="group-photo"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90"
          >
            <Camera className="w-4 h-4 dark:text-gray-700" />
          </label>
          <input
            id="group-photo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
          className="w-64 text-center text-lg font-medium"
        />

        
      </div>

      {/* Participants List */}
      <div className="flex flex-col flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Participants</h3>
          <Button
  size="sm"
  variant="outline"
  onClick={() => setIsAddModalOpen(true)}
>
  <UserPlus className="w-4 h-4 mr-1" /> Add
</Button>
<AddParticipantsModal
  open={isAddModalOpen}
  onClose={() => setIsAddModalOpen(false)}
  allUsers={allUsers}
  currentParticipants={chat.participants}
  onConfirm={handleAddParticipantsConfirm}
/>

        </div>

        {chat.participants.map((user: User) => (
          <div
            key={user.id}
            className="flex items-center justify-between py-2 border-b last:border-none"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.profilePicture || ""} />
                <AvatarFallback>{user.username?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span>{user.username}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-red-500 hover:text-red-600"
              onClick={() => handleRemoveParticipant(user.id)}
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupChatDetails;

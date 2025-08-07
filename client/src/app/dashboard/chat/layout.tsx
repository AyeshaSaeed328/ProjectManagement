'use client'

import ChatList from "./chatList";
import ChatWindow from "./chatWindow";
import { useState, useEffect } from "react";
import { useGetAllChatsQuery, ChatInterface, Message } from "@/state/api";

export default function ChatLayout() {
  const { data, isLoading, refetch } = useGetAllChatsQuery();
const [chats, setChats] = useState<ChatInterface[]>([]);

useEffect(() => {
  if (data?.data) {
   
    setChats(data?.data);
  }
}, [data]);

const updateChatLastMessage = (
  chatToUpdateId: string,
  message: Message
) => {
  const chatToUpdate = chats.find((chat) => chat.id === chatToUpdateId);
  if (!chatToUpdate) return;

  const updatedChat: ChatInterface = {
    ...chatToUpdate,
    lastMessage: message,
    updatedAt: message.updatedAt,
  };

  const otherChats = chats.filter((chat) => chat.id !== chatToUpdateId);

  const sortedChats = [updatedChat, ...otherChats].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  setChats(sortedChats);
};
console.log("chats", chats)


  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <ChatList
        chats={chats}
        selectedChatId={selectedChatId || ""}
        onSelectChat={setSelectedChatId}
        refetchChats={refetch}
      />
      <ChatWindow
  selectedChat={selectedChat}
  updateChatLastMessage={updateChatLastMessage}
/>
    </div>
  );
}

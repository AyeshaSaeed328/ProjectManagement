'use client'

import ChatList from "./chatList";
import ChatWindow from "./chatWindow";
import { useState } from "react";
import { useGetAllChatsQuery } from "@/state/api";

export default function ChatLayout() {
  const { data, isLoading, refetch } = useGetAllChatsQuery();
  const chats = data?.data || [];

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
      <ChatWindow selectedChat={selectedChat}/>
    </div>
  );
}

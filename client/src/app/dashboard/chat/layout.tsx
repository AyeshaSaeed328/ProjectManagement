'use client'

import ChatList from "./chatList";
import ChatWindow from "./chatWindow";
import { useState, useEffect } from "react";
import { useGetAllChatsQuery, ChatInterface, Message } from "@/state/api";
import GroupChatDetails from "./groupChatDetails";

type ActiveView =
  | { type: "chat"; chat: ChatInterface }
  | { type: "groupDetails"; chat: ChatInterface }
  | { type: "empty" };


export default function ChatLayout() {
  const { data, isLoading, refetch } = useGetAllChatsQuery();
  console.log("Fetched chats data:", data);

  
const [chats, setChats] = useState<ChatInterface[]>([]);

useEffect(() => {
  if (data?.data) {
    console.log("Fetched chats:", data.data);
   
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




    const [activeView, setActiveView] = useState<ActiveView>({ type: "empty" });
    const getActiveChat = () => {
  if (activeView.type === "chat" || activeView.type === "groupDetails") {
    return chats.find((c) => c.id === activeView.chat.id) || activeView.chat;
  }
  return null;
};


  if (isLoading) {
    return <div>Loading chats...</div>;
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
        <ChatList
        chats={chats}
        selectedChat={activeView.type === "chat" ? activeView.chat : undefined}
        onSelectChat={(chat) => setActiveView({ type: "chat", chat })}
        refetchChats={refetch}
      />
      <div className="flex-1">
        {activeView.type === "chat" && (
          <ChatWindow
            selectedChat={activeView.chat}
            updateChatLastMessage={updateChatLastMessage}
            onOpenGroupDetails={() =>
              setActiveView({ type: "groupDetails", chat: activeView.chat })
            }
          />
        )}

        {activeView.type === "groupDetails" && (
  <GroupChatDetails
    chat={getActiveChat()!} // Always pulls fresh data
    onBack={() => setActiveView({ type: "chat", chat: getActiveChat()! })}
    refetchChats={refetch}
  />
)}

        {activeView.type === "empty" && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a chat to start
          </div>
        )}
      </div>
    </div>
  );
}

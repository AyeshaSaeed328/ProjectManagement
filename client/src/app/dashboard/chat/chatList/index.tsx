'use client'

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ChatInterface, useGetAllUsersQuery, User, useCreateOneOnOneChatMutation } from "@/state/api";
import { UserGroupIcon } from "@heroicons/react/24/solid";
import { useSocket } from '@/context/socket'
import { useEffect, useState } from "react";
import AddChatModal from "@/(components)/AddChatModal";
import { Search } from "lucide-react";
import { useAppSelector } from "@/app/redux";



const NEW_CHAT_EVENT = "newChat";


interface ChatListItemProps {
  id: string;
  name: string;
  lastMessage: string;
  profilePic?: string;
  updatedAt: string;
  selected?: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  name,
  lastMessage,
  profilePic,
  updatedAt,
  selected,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 p-4 cursor-pointer transition-colors",
      selected ? "bg-muted dark:bg-dark-secondary" : "hover:bg-accent hover:dark:bg-dark-tertiary"
    )}
  >
    <Avatar>
      <AvatarImage src={profilePic} />
      <AvatarFallback>{name[0]}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="font-medium truncate dark:text-white">{name}</p>
      <p className="text-sm text-muted-foreground truncate">
        {lastMessage || "No messages yet"}
      </p>
    </div>
    <div className="text-xs text-muted-foreground whitespace-nowrap">
      {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
    </div>
  </div>
);


interface ChatListProps {
  chats: ChatInterface[];
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  refetchChats: ()=> void
}


const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  refetchChats
}) => {
  const { socket } = useSocket();

  const {data:allUsers, isLoading: usersLoading, isError: userssError} = useGetAllUsersQuery() 
  const [createOneChat, { isLoading: isChatOneLoading }] = useCreateOneOnOneChatMutation();
  
  const [openAddChat, setOpenAddChat] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User| null>(null)
  const currentUserId = useAppSelector((state) => state.global.auth.user?.id);

  
    const onNewChat = (chat: ChatInterface) => {
      
      setSearchTerm("")
      setShowSuggestions(false)
      setSelectedUser(null)
      // refetchChats();
    
  };

  const createNewChatWithUser = async (user: User) => {
  try {
    await createOneChat({ receiverId: user.id }).unwrap();
  } catch (error: any) {
    console.error("Error creating chat:", error);
  }
};


  const filteredChats = chats.filter((chat) => {
    const otherUser = chat.participants.find(p => p.id !== currentUserId);;
    const name = chat.isGroupChat
    ? chat.name
    : otherUser?.username || "";

    return name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const suggestedUsers =
    allUsers?.data.filter((user: User) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    useEffect(() => {
      // If the socket isn't initialized, we don't set up listeners.
      if (!socket) return;
  
      
      socket.on(NEW_CHAT_EVENT, onNewChat);
     
      return () => {
        
        socket.off(NEW_CHAT_EVENT, onNewChat);
        
      };
  
      
    }, [socket]);
  return (
    <aside className="relative w-full sm:w-80 h-full border-r bg-white dark:bg-dark-bg">
      <AddChatModal
        isOpen={openAddChat}
        onClose={() => {
          setOpenAddChat(false);
        }}
      />
       <div className="p-3">
        <div className="relative flex h-min w-full">
          <Search className="absolute left-[8px] top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search chats or users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            className="w-full rounded-md bg-gray-100 p-2 pl-9 text-sm text-gray-800 placeholder-gray-500 focus:outline-none dark:bg-dark-secondary dark:text-white dark:placeholder-white"
          />
        </div>

        {/* User Suggestions */}
        {showSuggestions && searchTerm && (
          <div className="mt-2 bg-white border rounded shadow dark:bg-dark-bg dark:text-white max-h-40 overflow-y-auto">
            {suggestedUsers.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No users found</div>
            ) : (
              suggestedUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-bg cursor-pointer"
                  onClick={() => {
                    // Optionally start a chat with this user here
                    console.log("Suggested user clicked:", user);
                    setSelectedUser(user)
                    setSearchTerm(user.username);
                    setShowSuggestions(false);
                    createNewChatWithUser(user);
                    onSelectChat(user.id)
                    
                  }}
                >
                  {user.username}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* Header */}
      <div className="px-4 py-2 text-sm font-medium text-muted-foreground uppercase">
        Your Chats
      </div>

      <ScrollArea className="h-full pr-2">
        {chats.length === 0 ? (
          <p className="p-4 text-muted-foreground">No chats yet</p>
        ) : (
            filteredChats.map((chat) => {
  const otherUser = chat.participants.find(p => p.id !== currentUserId);
            return (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                name={chat.isGroupChat ? chat.name : otherUser?.username || "Unknown"}
                lastMessage={chat.lastMessage?.content || ""}
                profilePic={otherUser?.profilePicture}
                updatedAt={chat.updatedAt.toString()}
                selected={selectedChatId === chat.id}
                onClick={() => onSelectChat(chat.id)}
              />
            );
          })
        )}
      </ScrollArea>

      {/* Floating Button */}
      <div className="absolute bottom-4 left-4">
        <button
          onClick={() => {
            setOpenAddChat(true)
          }}
          className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-500 rounded-full shadow-lg flex items-center justify-center"
        >
          <UserGroupIcon className="w-7 h-7 text-white" />
        </button>
      </div>
    </aside>
  );
};



export default ChatList;

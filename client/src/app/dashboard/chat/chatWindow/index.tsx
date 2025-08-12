'use client'

import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
} from "@/components/ui/chat/chat-bubble";

import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";

import { SendHorizonal, Paperclip, Image, X, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState} from "react";
import { 
  ChatInterface,
  Message,
  useLazyGetMessagesByChatQuery, 
  useSendMessageMutation, 
  useDeleteMessageMutation } from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { useSocket } from "@/context/socket";
import MessageLoading from "@/components/ui/chat/message-loading";
import {GroupChatDropdown} from "@/(components)/GroupChatDropdowm";
import { Progress } from "@/components/ui/progress";
import { ChatAttachments } from "@/components/ui/chat/chat-attachments";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { on } from "events";

interface ChatWindowProps {
  selectedChat: ChatInterface | null;
  updateChatLastMessage: (chatId: string, message: Message) => void;
  updateChatLastMessageOnDeletion: (chatId: string, message: Message) => void;
  onOpenGroupDetails: (chat: ChatInterface) => void;
  onExitGroupClick?: (chat: ChatInterface) => void;
  refetchChats: () => void;
  onLeaveChat: () => void;
}


const JOIN_CHAT_EVENT = "joinChat";
const NEW_CHAT_EVENT = "newChat";
const TYPING_EVENT = "typing";
const STOP_TYPING_EVENT = "stopTyping";
const MESSAGE_RECEIVED_EVENT = "messageReceived";
const LEAVE_CHAT_EVENT = "leaveChat";
const UPDATE_GROUP_NAME_EVENT = "updateGroupName";
const MESSAGE_DELETE_EVENT = "messageDeleted";

export default function ChatWindow({ selectedChat, updateChatLastMessage, onOpenGroupDetails, updateChatLastMessageOnDeletion, onLeaveChat }: ChatWindowProps) {
  const { socket } = useSocket();
  const [triggerGetMessages, { data, isLoading:getMessageLoading }] = useLazyGetMessagesByChatQuery();

const [sendMessage, { isLoading:sendMessageLoading, error }] = useSendMessageMutation();
const [deleteMessage] = useDeleteMessageMutation();
const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentUserId = useAppSelector((state)=>state.global.auth.user?.id)
  const currentChat = useRef<ChatInterface | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);




  const [messages, setMessages] = useState<Message[]>([]); // To store chat messages
  const [unreadMessages, setUnreadMessages] = useState<Message[]>(
    []
  ); 

  const [isTyping, setIsTyping] = useState(false); 
  const [selfTyping, setSelfTyping] = useState(false);

  const [message, setMessage] = useState("");

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleDeleteMessage = async(message: Message) => {
    try {
      await deleteMessage({messageId: message.id}).unwrap();
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
      if (currentChat.current?.id) {
        updateChatLastMessageOnDeletion(currentChat.current?.id, message);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

 const getMessages = async () => {
    if (!selectedChat ||!socket) return alert("Socket not available");

    // Emit an event to join the current chat
    socket.emit(JOIN_CHAT_EVENT, selectedChat?.id);

    // Filter out unread messages from the current chat as those will be read
    setUnreadMessages(
      unreadMessages.filter((msg) => msg.chat.id !== selectedChat?.id)
    );

     try {

    const res = await triggerGetMessages(selectedChat?.id).unwrap();
    console.log("Get messages", res)

    setMessages(res.data || []);
  } catch (error) {
  }
  };

   
const sendChatMessage = async () => {
  if (!selectedChat || !socket) return;

  socket.emit(STOP_TYPING_EVENT, selectedChat.id);

  try {
    const res = await sendMessage({
      chatId: selectedChat.id,
      content: message,
      attachments: attachedFiles,
      onUploadProgress: (percent) => setUploadProgress(percent),
    }).unwrap();

    setMessage("");
    setAttachedFiles([]);
    setMessages((prev) => [...prev, res.data]);
    updateChatLastMessage(selectedChat.id, res.data);
  } catch (err) {
    console.error("❌ Failed to send:", err);
  } finally {
    setUploadProgress(null); // reset after completion
  }
};

  // const onRenameGroupChat = useCallback((chat: ChatInterface) => {
  //   console.log("Group chat renamed:", chat);
    
  // }, []);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files) return; // No files selected

  const files = Array.from(e.target.files); // Safe now
  setAttachedFiles((prev) => [...prev, ...files]);
};


   const handleOnMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>{
    
    setMessage(e.target.value);

    if (!socket || !selectedChat) return;

    if (!selfTyping) {
      setSelfTyping(true);
      socket.emit(TYPING_EVENT, selectedChat?.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const timerLength = 3000;

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(STOP_TYPING_EVENT, selectedChat?.id);

      setSelfTyping(false);
    }, timerLength);
  };

  


  useEffect(()=>{
     if (!selectedChat) {
    currentChat.current = null;
    return;
  }
      if (selectedChat) {
        console.log("abccc")
      // Set the current chat reference to the one from local storage.
      currentChat.current = selectedChat;
      // If the socket connection exists, emit an event to join the specific chat using its ID.
      socket?.emit(JOIN_CHAT_EVENT, currentChat.current?.id);
      // Fetch the messages for the current chat.
      getMessages();
      console.log("Messages set", messages)
    }
  },[selectedChat])

  const selectedChatRef = useRef(selectedChat);
useEffect(() => {
  selectedChatRef.current = selectedChat;
}, [selectedChat]);

useEffect(() => {
  if (!socket) return;

  const onMessageReceived = (message: Message) => {
    if (message.chat.id !== selectedChatRef.current?.id) {
      setUnreadMessages(prev => [message, ...prev]);
    } else {
      setMessages(prev => [...prev, message]);
    }
    // refetchChats(); // Assuming this is a function to refresh the chat list 
    updateChatLastMessage(message.chat.id || "", message);
  };

  const onMessageDelete = (message: Message) => {
    if (message?.chat.id !== selectedChatRef.current?.id) {
      setUnreadMessages((prev) =>
        prev.filter((msg) => msg.id !== message.id)
      );
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
    }

    updateChatLastMessageOnDeletion(message.chat.id || "", message);
  };

  const handleOnSocketTyping = (chatId: string) => {
    if (chatId === selectedChatRef.current?.id) setIsTyping(true);
  };

  const handleOnSocketStopTyping = (chatId: string) => {
    if (chatId === selectedChatRef.current?.id) setIsTyping(false);
  };



  socket.on(MESSAGE_RECEIVED_EVENT, onMessageReceived);
  socket.on(TYPING_EVENT, handleOnSocketTyping);
  socket.on(STOP_TYPING_EVENT, handleOnSocketStopTyping);
  socket.on(MESSAGE_DELETE_EVENT, onMessageDelete);

  return () => {
    socket.off(MESSAGE_RECEIVED_EVENT, onMessageReceived);
    socket.off(TYPING_EVENT, handleOnSocketTyping);
    socket.off(STOP_TYPING_EVENT, handleOnSocketStopTyping);
    socket.off(MESSAGE_DELETE_EVENT, onMessageDelete);
  };
}, [socket, updateChatLastMessage]);



  if (!selectedChat) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full border-l bg-white dark:bg-dark-bg dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted dark:bg-dark-secondary">
      <div className="px-4 py-3 bg-muted flex items-center gap-2 dark:bg-dark-secondary">
        <ChatBubbleAvatar
          src={selectedChat.participants[0]?.profilePicture}
          fallback={selectedChat.participants[0]?.username || "?"}
          className="w-8 h-8"
        />
        <div className="text-sm font-medium">
          {selectedChat.isGroupChat
            ? selectedChat.name
            : selectedChat.participants.find((p) => p.id !== currentUserId)?.username || "Unknown User"}
        </div>
      </div>
      <div className="flex items-center gap-2">
    <GroupChatDropdown
  onOpenGroupDetails={() => {
    if (selectedChat) {
      onOpenGroupDetails(selectedChat);
    }
  }}
  chatId={selectedChat?.id}
/>
        
      </div>
      </div>

      {/* Messages */}

      <ChatMessageList>
        {messages?.map((msg) => {
          const isSent = msg.sender.id === currentUserId;
          return (
            <ChatBubble key={msg.id} variant={isSent ? "sent" : "received"}>
              <ChatBubbleAvatar
                src={msg.sender.profilePicture}
                fallback={msg.sender.username}
                className="w-6 h-6"
              />
              <div>
                <ChatBubbleMessage variant={isSent ? "sent" : "received"}>
                  {msg.content}
                </ChatBubbleMessage>
                <ChatAttachments attachments={msg.attachments || []} />
                 {/* Shadcn dropdown menu for options */}
              <ChatBubbleActionWrapper variant={isSent ? "sent" : "received"}>
                {msg.sender.id === currentUserId && (<DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <ChatBubbleAction
                      icon={<MoreVertical className="w-4 h-4" />}
                      aria-label="Message options"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom" className="w-40">
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => handleDeleteMessage(msg)}
                    >
                      Delete Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>)}
              </ChatBubbleActionWrapper>
              
          
                <ChatBubbleTimestamp
                  timestamp={new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </div>
            </ChatBubble>
          );
        })}
        {isTyping && (
          <div className="px-4 py-2 flex items-center gap-2">
            <ChatBubble variant="received">
              <ChatBubbleAvatar
          src={selectedChat.participants.find((p) => p.id !== currentUserId)?.profilePicture}
          fallback={
            selectedChat.participants.find((p) => p.id !== currentUserId)?.username?.[0] || "?"
          }
          className="w-6 h-6"
        />
        <div>
          <ChatBubbleMessage variant="received">
            <MessageLoading />
          </ChatBubbleMessage>
        </div>
      </ChatBubble>
    </div>
  )}
      </ChatMessageList>
      

      {/* Input */}
      <form
  onSubmit={(e) => {
    e.preventDefault();
    sendChatMessage();
  }}
  className="border-t px-4 py-3 flex flex-col gap-2"
>
  {/* Attachments preview */}
  {attachedFiles.length > 0 && (
    <div className="flex flex-wrap gap-2 p-2 border rounded dark:bg-dark-bg bg-muted">
      {attachedFiles.map((file, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-dark-secondary rounded shadow-sm"
        >
          {file.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-10 h-10 object-cover rounded"
            />
          ) : (
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-sm truncate max-w-[100px]">{file.name}</span>
          <button
            type="button"
            onClick={() =>
              setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
            }
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Message input + send button */}
  <div className="flex items-center gap-2">
    <ChatInput
      placeholder="Type your message..."
      value={message}
      ref={inputRef}
      onChange={handleOnMessageChange}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          sendChatMessage();
        }
      }}
    />
    <Button
      type="submit"
      size="icon"
      disabled={!message.trim() && attachedFiles.length === 0}
      className="bg-gradient-to-br from-purple-600 to-indigo-500 rounded-full shadow-lg"
    >
      <SendHorizonal className="w-5 h-5" />
    </Button>
  </div>

  {/* File pickers */}
  <div className="flex gap-3 pl-2 pt-2 my-2">
    <label htmlFor="file-upload" className="cursor-pointer">
      <Paperclip className="w-5 h-5 text-muted-foreground hover:text-foreground" />
    </label>
    <input
      id="file-upload"
      type="file"
      multiple
      hidden
      onChange={handleFileChange}
    />

    <label htmlFor="image-upload" className="cursor-pointer">
      <Image className="w-5 h-5 text-muted-foreground hover:text-foreground" />
    </label>
    <input
      id="image-upload"
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={handleFileChange}
    />
  </div>

  {/* Upload progress */}
  {/* {uploadProgress !== null && (
    <div className="mt-2">
      <Progress value={uploadProgress} />
      <span className="text-xs">{uploadProgress}%</span>
    </div>
  )} */}
</form>


    </div>
  );
}

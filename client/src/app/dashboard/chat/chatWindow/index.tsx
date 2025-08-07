'use client'

import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";

import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";

import { SendHorizonal, Paperclip, Image } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChatInterface, Message, useLazyGetMessagesByChatQuery, useSendMessageMutation } from "@/state/api";
import { useAppSelector } from "@/app/redux";
import { useSocket } from "@/context/socket";
import MessageLoading from "@/components/ui/chat/message-loading";

interface ChatWindowProps {
  selectedChat: ChatInterface | null;
  updateChatLastMessage: (chatId: string, message: Message) => void;
}

const JOIN_CHAT_EVENT = "joinChat";
const NEW_CHAT_EVENT = "newChat";
const TYPING_EVENT = "typing";
const STOP_TYPING_EVENT = "stopTyping";
const MESSAGE_RECEIVED_EVENT = "messageReceived";
const LEAVE_CHAT_EVENT = "leaveChat";
const UPDATE_GROUP_NAME_EVENT = "updateGroupName";
const MESSAGE_DELETE_EVENT = "messageDeleted";

export default function ChatWindow({ selectedChat, updateChatLastMessage }: ChatWindowProps) {
  const { socket } = useSocket();
  const [triggerGetMessages, { data, isLoading:getMessageLoading }] = useLazyGetMessagesByChatQuery();

const [sendMessage, { isLoading:sendMessageLoading, error }] = useSendMessageMutation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentUserId = useAppSelector((state)=>state.global.auth.user?.id)
  const currentChat = useRef<ChatInterface | null>(null);

  // To keep track of the setTimeout function
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define state variables and their initial values using 'useState'

  const [loadingChats, setLoadingChats] = useState(false); // To indicate loading of chats
  const [loadingMessages, setLoadingMessages] = useState(false); // To indicate loading of messages

  const [messages, setMessages] = useState<Message[]>([]); // To store chat messages
  const [unreadMessages, setUnreadMessages] = useState<Message[]>(
    []
  ); // To track unread messages

  const [isTyping, setIsTyping] = useState(false); // To track if someone is currently typing
  const [selfTyping, setSelfTyping] = useState(false); // To track if the current user is typing

  const [message, setMessage] = useState(""); // To store the currently typed message

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);



  
 const getMessages = async () => {
    // Check if socket is available, if not, show an alert
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
    alert("Error fetching messages");
  }
  };

   const sendChatMessage = async () => {
    // If no current chat ID exists or there's no socket connection, exit the function
    if (!selectedChat || !socket) return;

    // Emit a STOP_TYPING_EVENT to inform other users/participants that typing has stopped
    socket.emit(STOP_TYPING_EVENT, selectedChat?.id);
try {
    const res = await sendMessage({
      chatId: selectedChat.id,
      content: message,
      attachments: attachedFiles, // File[] from input
    }).unwrap();
    setMessage(""); // Clear the message input
        setAttachedFiles([]); // Clear the list of attached files
        setMessages((prev) => [ ...prev,res.data]); // Update messages in the UI
        updateChatLastMessage(selectedChat.id || "", res.data); 

    console.log("✅ Message sent:", res);
  } catch (err) {
    console.error("❌ Failed to send:", err);
  }
  }
  const onMessageReceived = useCallback((message: Message) => {
    console.log("Message Received")
    // Check if the received message belongs to the currently active chat
    if (message?.chat.id !== selectedChat?.id) {
      // If not, update the list of unread messages
      setUnreadMessages((prev) => [message, ...prev]);
    } else {
      // If it belongs to the current chat, update the messages list for the active chat
      setMessages((prev) => [ ...prev,message]);
    }

    // Update the last message for the chat to which the received message belongs
    updateChatLastMessage(message.chat.id || "", message);
  },[selectedChat, updateChatLastMessage]);


   const handleOnMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>{
    // Update the message state with the current input value
    setMessage(e.target.value);

    // If socket doesn't exist or isn't connected, exit the function
    if (!socket || !selectedChat) return;

    // Check if the user isn't already set as typing
    if (!selfTyping) {
      // Set the user as typing
      setSelfTyping(true);

      // Emit a typing event to the server for the current chat
      socket.emit(TYPING_EVENT, selectedChat?.id);
    }

    // Clear the previous timeout (if exists) to avoid multiple setTimeouts from running
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Define a length of time (in milliseconds) for the typing timeout
    const timerLength = 3000;

    // Set a timeout to stop the typing indication after the timerLength has passed
    typingTimeoutRef.current = setTimeout(() => {
      // Emit a stop typing event to the server for the current chat
      socket.emit(STOP_TYPING_EVENT, selectedChat?.id);

      // Reset the user's typing state
      setSelfTyping(false);
    }, timerLength);
  };

  const handleOnSocketTyping = useCallback((chatId: string) => {
    // Check if the typing event is for the currently active chat.
    if (chatId !== selectedChat?.id) return;

    // Set the typing state to true for the current chat.
    setIsTyping(true);
  }, [selectedChat]);

  /**
   * Handles the "stop typing" event on the socket.
   */
  const handleOnSocketStopTyping = useCallback((chatId: string) => {
    // Check if the stop typing event is for the currently active chat.
    if (chatId !== selectedChat?.id) return;

    // Set the typing state to false for the current chat.
    setIsTyping(false);
  },[selectedChat])



  useEffect(()=>{
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

  useEffect(() => {
  if (!socket) return;

  // console.log("mounting");
  socket.on(TYPING_EVENT, handleOnSocketTyping);
  socket.on(STOP_TYPING_EVENT, handleOnSocketStopTyping);
  socket.on(MESSAGE_RECEIVED_EVENT, onMessageReceived);

  return () => {
    socket.off(TYPING_EVENT, handleOnSocketTyping);
    socket.off(STOP_TYPING_EVENT, handleOnSocketStopTyping);
    socket.off(MESSAGE_RECEIVED_EVENT, onMessageReceived);
  };
}, [socket, onMessageReceived, handleOnSocketTyping, handleOnSocketStopTyping]);


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
      <div className="px-4 py-3 border-b bg-muted flex items-center gap-2 dark:bg-dark-secondary">
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
   
  }}
  className="border-t px-4 py-3 flex gap-2 items-end"
>
  
  <div className="flex flex-col w-full gap-1">
    <div className="flex items-center gap-2">
    {/* Chat Input */}
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
    {/* Send Button */}
  <Button type="submit" size="icon" disabled={!message.trim()} className="bg-gradient-to-br from-purple-600 to-indigo-500 rounded-full shadow-lg" onClick={sendChatMessage}>

    <SendHorizonal className="w-5 h-5 " />
  </Button>
  </div>

    {/* Icons Below Input */}
    <div className="flex gap-3 pl-2 pt-2 my-2">
      <label htmlFor="file-upload" className="cursor-pointer">
        <Paperclip className="w-5 h-5 text-muted-foreground hover:text-foreground" />
      </label>
      <input id="file-upload" type="file" hidden />

      <label htmlFor="image-upload" className="cursor-pointer">
        <Image className="w-5 h-5 text-muted-foreground hover:text-foreground" />
      </label>
      <input id="image-upload" type="file" accept="image/*" hidden />
    </div>
  </div>

  
</form>

    </div>
  );
}

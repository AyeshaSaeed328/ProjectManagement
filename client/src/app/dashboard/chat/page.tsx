'use client'

import { useSocket } from '@/context/socket'
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import { ChatInterface, Message } from '@/state/api';
import { 
  getChatObjectMetadata,
  classNames

 } from '@/lib/utils';
 import { useAppSelector } from '@/app/redux';
 import { useGetAllChatsQuery } from '@/state/api';
 

const CONNECTED_EVENT = "connected";
const DISCONNECT_EVENT = "disconnect";
const JOIN_CHAT_EVENT = "joinChat";
const NEW_CHAT_EVENT = "newChat";
const TYPING_EVENT = "typing";
const STOP_TYPING_EVENT = "stopTyping";
const MESSAGE_RECEIVED_EVENT = "messageReceived";
const LEAVE_CHAT_EVENT = "leaveChat";
const UPDATE_GROUP_NAME_EVENT = "updateGroupName";
const MESSAGE_DELETE_EVENT = "messageDeleted";


const Chat = () => {
  const { socket } = useSocket();
  const user = useAppSelector((state) => state.global.auth.user)
  const {data:allChats, isLoading: chatsLoading, isError: chatsError} = useGetAllChatsQuery() 
  console.log("chats", allChats)
  const currentChat = useRef<ChatInterface | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false); 

  const [openAddChat, setOpenAddChat] = useState(false); 
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // const [chats, setChats] = useState<ChatInterface[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Message[]>(
    []
  );

  const [isTyping, setIsTyping] = useState(false);
  const [selfTyping, setSelfTyping] = useState(false);

  const [message, setMessage] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

  const onConnect = () => {
    setIsConnected(true);
  };

  const onDisconnect = () => {
    setIsConnected(false);
  };

 // This useEffect handles the setting up and tearing down of socket event listeners.
  useEffect(() => {
    // If the socket isn't initialized, we don't set up listeners.
    if (!socket) return;

    // Set up event listeners for various socket events:
    // Listener for when the socket connects.
    socket.on(CONNECTED_EVENT, onConnect);
    // Listener for when the socket disconnects.
    socket.on(DISCONNECT_EVENT, onDisconnect);
    // Listener for when a user is typing.
    // socket.on(TYPING_EVENT, handleOnSocketTyping);
    // // Listener for when a user stops typing.
    // socket.on(STOP_TYPING_EVENT, handleOnSocketStopTyping);
    // // Listener for when a new message is received.
    // socket.on(MESSAGE_RECEIVED_EVENT, onMessageReceived);
    // // Listener for the initiation of a new chat.
    // socket.on(NEW_CHAT_EVENT, onNewChat);
    // // Listener for when a user leaves a chat.
    // socket.on(LEAVE_CHAT_EVENT, onChatLeave);
    // // Listener for when a group's name is updated.
    // socket.on(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
    // //Listener for when a message is deleted
    // socket.on(MESSAGE_DELETE_EVENT, onMessageDelete);
    // When the component using this hook unmounts or if `socket` or `chats` change:
    return () => {
      // Remove all the event listeners we set up to avoid memory leaks and unintended behaviors.
      socket.off(CONNECTED_EVENT, onConnect);
      socket.off(DISCONNECT_EVENT, onDisconnect);
      // socket.off(TYPING_EVENT, handleOnSocketTyping);
      // socket.off(STOP_TYPING_EVENT, handleOnSocketStopTyping);
      // socket.off(MESSAGE_RECEIVED_EVENT, onMessageReceived);
      // socket.off(NEW_CHAT_EVENT, onNewChat);
      // socket.off(LEAVE_CHAT_EVENT, onChatLeave);
      // socket.off(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
      // socket.off(MESSAGE_DELETE_EVENT, onMessageDelete);
    };

    
  }, [socket, allChats]);
 if(chatsLoading) return <div>Loading...</div>
 if (chatsError) return <div>Error fetching chats</div>
  return (
    <>
    <div>Chat</div>
    
    </>
  )
}

export default Chat

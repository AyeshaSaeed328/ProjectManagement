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
import { useEffect, useRef, useState } from "react";

interface ChatWindowProps {
  selectedChat: {
    id: string;
    participants: { id: string; username: string; profilePicture?: string }[];
    messages: {
      id: string;
      content: string;
      createdAt: string;
      sender: { id: string; username: string; profilePicture?: string };
    }[];
  } | null;
}

export default function ChatWindow({ selectedChat }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentUserId = "me"; // Replace this with auth context or global state

  const handleSend = () => {
    if (!message.trim()) return;

    // Send message logic here...
    console.log("Sending message:", message);
    setMessage("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  if (!selectedChat) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full border-l bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted flex items-center gap-2">
        <ChatBubbleAvatar
          src={selectedChat.participants[0]?.profilePicture}
          fallback={selectedChat.participants[0]?.username|| "?"}
          className="w-8 h-8"
        />
        <div className="text-sm font-medium">{selectedChat.participants[0]?.username}</div>
      </div>

      
      <ChatMessageList className="flex-1">
        {selectedChat.messages?.map((msg) => {
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
      </ChatMessageList>

      {/* Input */}
      <form
  onSubmit={(e) => {
    e.preventDefault();
    handleSend();
  }}
  className="border-t px-4 py-3 flex gap-2 items-end"
>
  <div className="relative w-full">
  <ChatInput
    placeholder="Type your message..."
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    ref={inputRef}
    className="pr-20" // add padding to make space for icons
  />
  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
    <label htmlFor="file-upload" className="cursor-pointer">
      <Paperclip className="w-4 h-4 text-muted-foreground hover:text-foreground" />
    </label>
    <input id="file-upload" type="file" hidden  />

    <label htmlFor="image-upload" className="cursor-pointer">
      <Image className="w-4 h-4 text-muted-foreground hover:text-foreground" />
    </label>
    <input id="image-upload" type="file" accept="image/*" hidden />
  </div>
</div>


  {/* Send Button */}
  <Button type="submit" size="icon" disabled={!message.trim()}>
    <SendHorizonal className="w-5 h-5" />
  </Button>
</form>

    </div>
  );
}

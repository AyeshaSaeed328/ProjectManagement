'use client';

import { ChatInterface } from '@/state/api';
import React from 'react';

interface ChatWindowProps {
  selectedChat: ChatInterface | null;
}

const ChatWindow = ({ selectedChat }: ChatWindowProps) => {
  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No chat selected
      </div>
    );
  }

  return (
    <div className="flex-1 p-4">
      <h2 className="text-xl font-semibold mb-4">{selectedChat.name}</h2>
      {/* Replace below with your messages UI */}
      <div className="text-gray-600">Chat messages will appear here</div>
    </div>
  );
};

export default ChatWindow;

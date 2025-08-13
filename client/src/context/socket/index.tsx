'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);


type SocketProviderProps = {
  children: ReactNode;
};
const CONNECTED_EVENT = "connected";
const DISCONNECT_EVENT = "disconnect";

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false)

  const onConnect = () => {
      setIsConnected(true);
    };
  
    const onDisconnect = () => {
      setIsConnected(false);
    };

  useEffect(() => {
    const socketInstance = io("http://localhost:4000", {
      withCredentials: true, 
    });
    // Listener for when the socket connects.
    socketInstance.on(CONNECTED_EVENT, onConnect);
    // Listener for when the socket disconnects.
    socketInstance.on(DISCONNECT_EVENT, onDisconnect);

    setSocket(socketInstance);

    return () => {
      socketInstance.off(CONNECTED_EVENT, onConnect);
      socketInstance.off(DISCONNECT_EVENT, onDisconnect);
      socketInstance.disconnect();
    };
  }, []);

const value = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
  <SocketContext.Provider value={value}>
    {children}
  </SocketContext.Provider>
  );
};

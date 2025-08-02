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
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

export const useSocket = () => useContext(SocketContext);


type SocketProviderProps = {
  children: ReactNode;
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:4000", {
      withCredentials: true, // ✅ Send HTTP-only cookie with request
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const value = useMemo(() => ({ socket }), [socket]);

  return (
  <SocketContext.Provider value={value}>
    {children}
  </SocketContext.Provider>
  );
};

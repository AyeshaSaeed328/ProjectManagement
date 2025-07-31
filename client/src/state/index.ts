import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {User} from "@/state/api";
import { Socket } from "socket.io-client";



interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface SocketState {
  isConnected: boolean;
  socket: any | null;
}

export interface initialStateTypes{
    isSidebarOpen: boolean;
    isDarkMode: boolean;  
    auth: AuthState; 
    chat: SocketState; 
}

const initialState: initialStateTypes = {
    isSidebarOpen: false,
    isDarkMode: true,
    auth: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    },
    chat: {
      isConnected: false,
      socket: null,
    },
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    toggleSidebar: (state, action:PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleDarkMode: (state, action:PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    setAuthUser: (state, action: PayloadAction<User | null>) => {
      state.auth.user = action.payload;
      state.auth.isAuthenticated = !!action.payload;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.auth.isLoading = action.payload;
    },
    clearAuth: (state) => {
      state.auth.user = null;
      state.auth.isAuthenticated = false;
      state.auth.isLoading = false;
    },
    setSocket: (state, action: PayloadAction<Socket>) => {
      state.chat.socket = action.payload;
      state.chat.isConnected = !!action.payload;
    },
    clearSocket: (state) => {
      state.chat.socket = null;
      state.chat.isConnected = false;
    },

  },
});
export const { toggleSidebar, toggleDarkMode, setAuthUser, setAuthLoading, clearAuth, setSocket, clearSocket } = globalSlice.actions;
export default globalSlice.reducer;

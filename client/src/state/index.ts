import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {User} from "@/state/api";



interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}



export interface initialStateTypes{
    isSidebarOpen: boolean;
    isDarkMode: boolean;  
    auth: AuthState; 
}

const initialState: initialStateTypes = {
    isSidebarOpen: false,
    isDarkMode: true,
    auth: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
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
    

  },
});
export const { toggleSidebar, toggleDarkMode, setAuthUser, setAuthLoading, clearAuth } = globalSlice.actions;
export default globalSlice.reducer;

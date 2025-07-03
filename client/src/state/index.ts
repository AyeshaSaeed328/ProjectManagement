import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export interface initialStateTypes{
    isSidebarOpen: boolean;
    isDarkMode: boolean;    
}

const initialState: initialStateTypes = {
    isSidebarOpen: false,
    isDarkMode: true,
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
  },
});
export const { toggleSidebar, toggleDarkMode } = globalSlice.actions;
export default globalSlice.reducer;

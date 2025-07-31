'use client'

import React from 'react'
import Navbar from '@/(components)/Navbar'
import Sidebar from '@/(components)/Sidebar'
import {useAppSelector} from './redux'
import { useGetProjectsQuery } from '@/state/api'
import { setSocket, clearSocket } from "@/state";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppDispatch } from './redux'


const DashboardLayout = ({children}: {children: React.ReactNode}) => {
  const isSidebarOpen = useAppSelector((state) => state.global.isSidebarOpen,
)
const socketRef = useRef<Socket | null>(null);

  const dispatch = useAppDispatch();
const isDarkMode = useAppSelector((state) => state.global.isDarkMode,
)
const {isAuthenticated, isLoading} = useAppSelector((state) => state.global.auth)
// console.log(isDarkMode, "dark")

useEffect(() => {
  if (isDarkMode){
    document.documentElement.classList.add("dark")
  }
  else{
    document.documentElement.classList.remove("dark")
  }
}, [isDarkMode])

useEffect(() => {
    if (!isAuthenticated) return; // ensure only runs when authenticated

    socketRef.current = io("http://localhost:4000", {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      console.log("🔌 Socket connected:", socketRef.current?.id);
      dispatch(setSocket(socketRef.current!));
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      dispatch(clearSocket());
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("⚠️ Socket connection error", err);
    });

    return () => {
      socketRef.current?.disconnect();
      dispatch(clearSocket());
    };
  }, [isAuthenticated, dispatch]);

const {
  data: projects,
  isLoading: isProjectsLoading,
  isError: isProjectsError,
} = useGetProjectsQuery(undefined, {
  skip: isLoading || !isAuthenticated, // only runs when ready
});

if (isProjectsLoading) return <div>Loading...</div>;
if (isProjectsError || !projects) return <div>Error fetching data</div>;


  const projectArray = Array.isArray(projects.data) ? projects.data : [];
  
  return (
    <div className='flex min-h-screen w-full bg-gray-50 text-gray-900'>
      {/* set z value also other than static*/}
        {isSidebarOpen && <Sidebar projects={projectArray}/>}
        <main className={`dark:bg-dark-bg flex w-full flex-col ${
          isSidebarOpen? "md:pl-85" : ""
        }`}>
            <Navbar/>
            {children}
        </main>
    </div>
    

  )
}

const DashboardWrapper = ({children}: {children: React.ReactNode}) => {
  return (
    
      <DashboardLayout>
        {children}
      </DashboardLayout>
  ) 
}

export default DashboardWrapper
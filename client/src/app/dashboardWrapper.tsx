'use client'

import React from 'react'
import Navbar from '@/(components)/Navbar'
import Sidebar from '@/(components)/Sidebar'
import {useAppSelector} from './redux'
import { useGetProjectsQuery } from '@/state/api'
import { useEffect, useRef } from "react";
import { useAppDispatch } from './redux'


const DashboardLayout = ({children}: {children: React.ReactNode}) => {
  const isSidebarOpen = useAppSelector((state) => state.global.isSidebarOpen,
)

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
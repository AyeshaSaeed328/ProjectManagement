'use client'

import React from 'react'
import Navbar from '@/(components)/Navbar'
import Sidebar from '@/(components)/Sidebar'
import StoreProvider, {useAppSelector} from './redux'
import { useEffect } from 'react'

const DashboardLayout = ({children}: {children: React.ReactNode}) => {
  const isSidebarOpen = useAppSelector((state) => state.global.isSidebarOpen,
)
const isDarkMode = useAppSelector((state) => state.global.isDarkMode,
)
console.log(isDarkMode, "dark")

useEffect(() => {
  if (isDarkMode){
    document.documentElement.classList.add("dark")
  }
  else{
    document.documentElement.classList.remove("dark")
  }
})
  
  return (
    <div className='flex min-h-screen w-full bg-gray-50 text-gray-900'>
        <Sidebar/>
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
    <StoreProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </StoreProvider>
  ) 
}

export default DashboardWrapper
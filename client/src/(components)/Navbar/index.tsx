'use client'
import React from 'react'
import {Search, Settings, Sun, Moon, Menu} from "lucide-react"
import Link  from 'next/link'
import { useAppDispatch, useAppSelector } from '@/app/redux'
import { toggleDarkMode, toggleSidebar } from '@/state'



const Navbar = () => {
  const dispatch = useAppDispatch();
  const isSidebarOpen = useAppSelector((state) => 
    state.global.isSidebarOpen,
  )
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode,
  )

  return (
    <div className='flex items-center justify-between bg-white px-4 py-3 dark:bg-dark-bg'>
      {/* {Search and side bar button} */}
    <div className='flex items-center gap-8'>
      {isSidebarOpen? null: (<button onClick={() => dispatch(toggleSidebar(!isSidebarOpen))}>
        <Menu className='h-6 w-6 cursor-pointer dark:text-white'/>

      </button>)}
      
      {/* sidebar button */}
      <div className='relative flex h-min w-[200px]'>
       <Search className='absolute left-[4px] top-1/2 mr-2 h-5 w-5 transform -translate-y-1/2  cursor-pointer dark:text-white'/>
       <input
       className='w-full rounded border-none bg-gray-100 p-2 pl-8 text-gray-700 placeholder-gray-500 focus: border-transparent focus:outline-none dark:bg-gray-700 dark:text-white dark:placeholder-white'
       type="search" placeholder='Search...'/>
        
      </div>
      
    </div>
    {/* {right side logos} */}
    <div className='flex items-center'>
      <button
          onClick={() => dispatch(toggleDarkMode(!isDarkMode))}
          className={
            isDarkMode
              ? `rounded p-2 dark:hover:bg-gray-700`
              : `rounded p-2 hover:bg-gray-100`
          }
        >
          {isDarkMode ? (
            <Sun className="h-6 w-6 cursor-pointer dark:text-white" />
          ) : (
            <Moon className="h-6 w-6 cursor-pointer dark:text-white" />
          )}
        </button>
        <Link
          href="/settings"
          className={
            isDarkMode
              ? `h-min w-min rounded p-2 dark:hover:bg-gray-700`
              : `h-min w-min rounded p-2 hover:bg-gray-100`
          }
        > <Settings className="h-6 w-6 cursor-pointer dark:text-white" />
        </Link>
     


    </div>
    </div>
    
  )
}

export default Navbar
'use client';

import React, { useState } from 'react';
import { Home, ChevronDown, ChevronRight, Folder,  LockIcon , X, AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Briefcase,
  Layers3,
  LucideIcon,
  ShieldAlert,
  User,
  Users,
  Plus,
   } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from '@/app/redux'
import { toggleSidebar } from '@/state';
import { Project } from '@/state/api';
import ModalNewProject from '@/app/dashboard/projects/ModalNewProject';




const Sidebar = ({ projects }: { projects: Project[] }) => {
  const [showProjects, setShowProjects] = useState(true);
  const [showPriority, setShowPriority] = useState(true);
  const [isModalNewProjectOpen, setIsModalNewProjectOpen] = useState(false);
  
    // Redux hooks
  const dispatch = useAppDispatch();
    const isSidebarOpen = useAppSelector((state) => 
      state.global.isSidebarOpen,
    )
    const user = useAppSelector((state) => state.global.auth.user)
    

  return (
    <aside className="fixed h-screen w-85 bg-white dark:bg-dark-bg p-4 border-r border-gray-200 dark:border-stroke-dark flex flex-col text-sm shadow-xl transition-all duration-300 z-40 overflow-y-auto dark:text-white ">
      <div className="flex h-[100%] w-full flex-col justify-start">
        <ModalNewProject
          isOpen={isModalNewProjectOpen}
          onClose={() => setIsModalNewProjectOpen(false)}
        />
        <div className="z-50 flex min-h-[56px] w-85 items-center justify-between px-6 pt-3">
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            Collabster
          </div>
            
          {!isSidebarOpen ? null : (
            <button
              className="py-3"
              onClick={() => {
                dispatch(toggleSidebar(!isSidebarOpen));
              }}
            > <X className="h-6 w-6 mr-4 text-gray-800 hover:text-gray-500 dark:text-white" />
            </button>
            )}
            
         
        </div>
        {/* TEAM */}
        <div className="flex items-center gap-5 border-y-[1.5px] border-gray-200 px-8 py-8 dark:border-gray-700">
          <Image
  src={user?.profilePicture! || ""}
  alt="Logo"
  width={40}
  height={40}
/>

          <div>
            <h3 className="text-lg font-bold tracking-wide dark:text-gray-200">
              {user?.username}
            </h3>
            <div className="mt-1 flex items-start gap-2">
              <LockIcon className="mt-[0.1rem] h-3 w-3 text-gray-500 dark:text-gray-400" />
              <p className="text-xs text-gray-500">Private</p>
            </div>
          </div>
        </div>

      {/* Top Nav Links */}
      <div className="space-y-3 mb-6 gap-5 border-b-[1.5px]  border-gray-200 px-8 py-4">
        {/* <NavItem icon={Home} label="Home" />
        <NavItem icon={Inbox} label="Inbox" />
        <NavItem icon={MoreHorizontal} label="More" /> */}
      
      <nav className="z-10 w-full">
          <NavItem icon={Home} label="Home" href="/dashboard" />
          <NavItem icon={Briefcase} label="Timeline" href="/dashboard/timeline" />
          <NavItem icon={User} label="Users" href="/dashboard/users" />
          <NavItem icon={Users} label="Teams" href="/dashboard/teams" />
        </nav>
        </div>

      {/* Projects Section */}
      <SectionHeader
  title="Projects"
  isOpen={showProjects}
  onToggle={() => setShowProjects(!showProjects)}
  rightElement={
    <button
      onClick={() => setIsModalNewProjectOpen(true)} // or your logic here
      className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
      title="Create new project"
    >
      <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
    </button>
  }
/>

      {showProjects && (
        <div className="ml-4 space-y-2 mb-6 border-b-[1.5px] gap-5  border-gray-200 px-8 py-4">
          {projects.map((project) => (
            <NavItem
              key={project.id}
              icon={Folder}
              label={project.name}
              href={`/dashboard/projects/${project.id}`}
            />
            ))}
          
        </div>
      )}

      {/* Priorities Section */}
      <SectionHeader
        title="Priorities"
        isOpen={showPriority}
        onToggle={() => setShowPriority(!showPriority)}
      />
      
      {showPriority && (
          <div className="ml-4 space-y-2 border-b-[1.5px] gap-5 border-gray-200 px-8 py-4">
            <NavItem
              icon={AlertCircle}
              label="Urgent"
              href="/priority/urgent"
            />
            <NavItem
              icon={ShieldAlert}
              label="High"
              href="/priority/high"
            />
            <NavItem
              icon={AlertTriangle}
              label="Medium"
              href="/priority/medium"
            />
            <NavItem icon={AlertOctagon} label="Low" href="/priority/low" />
            <NavItem
              icon={Layers3}
              label="Backlog"
              href="/priority/backlog"
            />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
}


const NavItem = ({ href, icon: Icon, label }: NavItemProps) => {
 const pathname = usePathname();
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href} className="w-full">
      <div
        className={`relative flex cursor-pointer items-center gap-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
          isActive ? "bg-gray-50 text-white dark:bg-gray-600" : ""
        } justify-start px-8 py-3`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 h-[100%] w-[5px] bg-purple-500" />
        )}

        <Icon className="h-6 w-6 text-gray-800 dark:text-gray-100" />
        <span className={`font-medium text-gray-800 dark:text-gray-100`}>
          {label}
        </span>
      </div>
    </Link>
  );
}
const SectionHeader = ({
  title,
  isOpen,
  onToggle,
  rightElement,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  rightElement?: React.ReactNode;
}) => (
  <div
    className="flex items-center justify-between px-8 mb-2 select-none cursor-pointer"
    onClick={onToggle}
  >
    {/* Left: Section title */}
    <span className="text-gray-500 uppercase tracking-wider text-md font-semibold">
      {title}
    </span>

    {/* Right: rightElement (e.g. Plus) + Chevron */}
    <div className="flex items-center gap-2">
      {rightElement}
      {isOpen ? (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-500" />
      )}
    </div>
  </div>
);

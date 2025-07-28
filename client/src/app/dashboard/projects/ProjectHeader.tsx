import Header from "@/(components)/Header";
import {
  Clock,
  Filter,
  Grid3x3,
  List,
  PlusSquare,
  Share2,
  Table,
} from "lucide-react";
import React, { useState } from "react";
import ModalNewProject from "./ModalNewProject";
import { Project } from "@/state/api";

type Props = {
  activeTab: string;
  setActiveTab: (tabName: string) => void;
  project: Project | null
};

const ProjectHeader = ({ activeTab, setActiveTab, project }: Props) => {
  const [isModalNewProjectOpen, setIsModalNewProjectOpen] = useState(false);

  return (
    <div className="px-4 xl:px-6">
      <ModalNewProject
        isOpen={isModalNewProjectOpen}
        onClose={() => setIsModalNewProjectOpen(false)}
      />
      <div className=" pt-6 lg:pt-8 bg-white dark:bg-dark-bg">
        <Header
          name={project?.name ?? ""}
          buttonComponent={
            <button
              className="flex items-center rounded-md bg-purple-600 px-3 py-2 text-white font-semibold hover:bg-purple-500"
              onClick={() => setIsModalNewProjectOpen(true)}
            >
              <PlusSquare className="mr-2 h-5 w-5" /> New Boards
            </button>
          }
        />
      </div>
      <div className="flex items-center space-x-3 mt-2 pb-6 lg:pb-8 px-4">
        <img
          src={project?.manager?.profilePicture ?? "/default-avatar.png"}
          alt="Manager Profile"
          className="w-10 h-10 rounded-full object-cover border"
        />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">
              {project?.manager?.username ?? "Unknown"}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Project Manager</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap-reverse gap-2 border-y bg-white dark:bg-dark-bg border-gray-200 pb-[8px] pt-2 dark:border-stroke-dark md:items-center">
        <div className="flex flex-1 items-center gap-2 md:gap-4">
          <TabButton
            name="Board"
            icon={<Grid3x3 className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
          <TabButton
            name="List"
            icon={<List className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
          <TabButton
            name="Timeline"
            icon={<Clock className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
          <TabButton
            name="Table"
            icon={<Table className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-500 hover:text-purple-600 dark:text-neutral-500 dark:hover:text-purple-400">
            <Filter className="h-5 w-5" />
          </button>
          <button className="text-gray-500 hover:text-purple-600 dark:text-neutral-500 dark:hover:text-purple-400">
            <Share2 className="h-5 w-5" />
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Task"
              className="rounded-md border py-1 pl-10 pr-4 focus:outline-purple-600 dark:border-dark-secondary dark:bg-dark-secondary dark:text-white"
            />
            <Grid3x3 className="absolute left-3 top-2 h-4 w-4 text-gray-400 dark:text-neutral-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

type TabButtonProps = {
  name: string;
  icon: React.ReactNode;
  setActiveTab: (tabName: string) => void;
  activeTab: string;
};

const TabButton = ({ name, icon, setActiveTab, activeTab }: TabButtonProps) => {
  const isActive = activeTab === name;

  return (
    <button
      className={`relative flex items-center font-semibold gap-2 px-1 py-2 text-gray-500 after:absolute after:-bottom-[9px] after:left-0 after:h-[1px] after:w-full hover:text-purple-600 dark:text-neutral-500 dark:hover:text-purple-400 sm:px-2 lg:px-4 ${isActive ? "text-purple-600 after:bg-purple-600 dark:text-white" : ""
        }`}
      onClick={() => setActiveTab(name)}
    >
      {icon}
      {name}
    </button>
  );
};

export default ProjectHeader;
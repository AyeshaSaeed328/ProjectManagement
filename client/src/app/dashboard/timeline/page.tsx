"use client";

import { useAppSelector } from "@/app/redux";
import Header from "@/(components)/Header";
import { useGetProjectsQuery } from "@/state/api";
import { DisplayOption, Gantt, ViewMode } from "@rsagiev/gantt-task-react-19";
import "@rsagiev/gantt-task-react-19/dist/index.css";
import React, { useMemo, useState } from "react";

type TaskTypeItems = "task" | "milestone" | "project";



const Timeline = () => {
  const { data: res, isLoading, isError } = useGetProjectsQuery();
const projects = res?.data ||[]

  const [displayOptions, setDisplayOptions] = useState<DisplayOption>({
    viewMode: ViewMode.Month,
    locale: "en-US",
  });

  const ganttTasks = useMemo(() => {
    const today = new Date().getTime();

    
    return (
    projects?.map((project) => {
      const start = new Date(project.startDate as string);
      const end = new Date(project.endDate as string);
      const duration = end.getTime() - start.getTime();
      const elapsed = today - start.getTime();

      // Clamp progress between 0 and 100
      const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));

      return {
        start,
        end,
        name: project.name,
        id: `Project-${project.id}`,
        type: "project" as TaskTypeItems,
        progress: Math.round(progress),
        isDisabled: false,
      };
    }) || []
  );
}, [projects]);
 

  const handleViewModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setDisplayOptions((prev) => ({
      ...prev,
      viewMode: event.target.value as ViewMode,
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !projects)
    return <div>An error occurred while fetching projects</div>;

  return (
    <div className="max-w-full p-8">
      <header className="mb-4 flex items-center justify-between">
        <Header name="Projects Timeline" />
        <div className="relative inline-block w-64">
          <select
            className="focus:shadow-outline block w-full appearance-none rounded border border-gray-400 bg-white px-4 py-2 pr-8 leading-tight shadow hover:border-gray-500 focus:outline-none dark:border-dark-secondary dark:bg-dark-secondary dark:text-white"
            value={displayOptions.viewMode}
            onChange={handleViewModeChange}
          >
            <option value={ViewMode.Day}>Day</option>
            <option value={ViewMode.Week}>Week</option>
            <option value={ViewMode.Month}>Month</option>
          </select>
        </div>
      </header>

      <div className="overflow-hidden rounded-md bg-white shadow dark:bg-dark-secondary dark:text-white">
        <div className="timeline">
          <Gantt
            tasks={ganttTasks}
            {...displayOptions}
            columnWidth={displayOptions.viewMode === ViewMode.Month ? 150 : 100}
            listCellWidth=""
projectBackgroundColor="#3b0764"
            projectProgressColor="#ec4899"
            projectProgressSelectedColor="#ec4899"

        

          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;
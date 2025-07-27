// import { useAppSelector } from "@/app/redux";
import { DisplayOption, Gantt, ViewMode } from "@rsagiev/gantt-task-react-19";
import "@rsagiev/gantt-task-react-19/dist/index.css";
import React, { useMemo, useState } from "react";
import { Task } from "@/state/api";

type Props = {
  tasks: Task[];
};

type TaskTypeItems = "task" | "milestone" | "project";

const Timeline = ({ tasks }: Props) => {


  const [displayOptions, setDisplayOptions] = useState<DisplayOption>({
    viewMode: ViewMode.Day,
    locale: "en-US",
  });

  const ganttTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const today = new Date().getTime();


    return (
      tasks?.map((task) => {
        const start = new Date(task.startDate as string);
        const end = new Date(task.endDate as string);
        const duration = end.getTime() - start.getTime();
        const elapsed = today - start.getTime();

        // Clamp progress between 0 and 100
        const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));

        return {
          start,
          end,
          name: task.title,
          id: `Project-${task.id}`,
          type: "project" as TaskTypeItems,
          progress: Math.round(progress),
          isDisabled: false,
        };
      }) || []
    );
  }, [tasks]);



  const handleViewModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setDisplayOptions((prev) => ({
      ...prev,
      viewMode: event.target.value as ViewMode,
    }));
  };


  return (
    <div className="px-4 xl:px-6">
        <div className="relative inline-block w-64 mb-8">
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

      <div className="overflow-hidden rounded-md bg-white shadow dark:bg-dark-secondary dark:text-white">
        <div className="timeline">
          {ganttTasks.length > 0 ? (
          <Gantt
            tasks={ganttTasks}
            {...displayOptions}
            columnWidth={displayOptions.viewMode === ViewMode.Month ? 150 : 100}
            listCellWidth=""
            projectBackgroundColor="#3b0764"
            projectProgressColor="#ec4899"
            projectProgressSelectedColor="#ec4899" />):(
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
    No valid tasks to display.
  </div>
            )}
        </div>
        
      </div>
    </div>
  );
};

export default Timeline;
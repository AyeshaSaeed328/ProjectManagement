"use client";

import React, { useState } from "react";
import ProjectHeader from "../ProjectHeader";
import Board from "../BoardView";
import List from "../ListView";
import Timeline from "../TimelineView";
import Table from "../TableView";
import ModalNewTask from "@/(components)/ModalNewTask";
import { useGetTasksAssignedByUserQuery, useGetTasksAssignedToUserQuery, useUpdateTaskInfoMutation, useGetAllTasksFromProjectQuery } from "@/state/api";
import { use } from 'react';
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

type Props = {
  params: { id: string };
};

const Project = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false)
  const {
    data: assignedRes,
    isLoading: loadingAssigned,
    error: errorAssigned,
  } = useGetTasksAssignedToUserQuery(undefined, {
    skip: !showMyTasksOnly, // only fetch when toggle is ON
  });
  
  const {
    data: allTasksRes,
    isLoading: loadingAll,
    error: errorAll,
  } = useGetAllTasksFromProjectQuery(id, {
    skip: showMyTasksOnly, // only fetch when toggle is OFF
  });
  
  const tasks = showMyTasksOnly
    ? assignedRes?.data ?? []
    : allTasksRes?.data ?? [];

    const isLoading = showMyTasksOnly ? loadingAssigned : loadingAll;
const error = showMyTasksOnly ? errorAssigned : errorAll;

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching tasks</div>;

  return (
    <div>
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={id}
      />
  <div className="flex flex-col">
  <ProjectHeader activeTab={activeTab} setActiveTab={setActiveTab} />
  
  <div className="flex items-center justify-between px-4 py-2 mx-4 text-gray-600 dark:text-neutral-400">
    <h2 className="text-xl gap-2 font-semibold mt-3">
      {showMyTasksOnly ? "My Tasks" : "All Tasks"}
    </h2>

    <div className="flex items-center gap-2">
      <Switch
        id="show-my-tasks"
        checked={showMyTasksOnly}
        onCheckedChange={setShowMyTasksOnly}
      />
      <label htmlFor="show-my-tasks" className="text-xs font-extralight">
        Show My Tasks Only
      </label>
    </div>
  </div>
</div>

      {activeTab === "Board" && (
        <Board setIsModalNewTaskOpen={setIsModalNewTaskOpen} tasks={tasks} />
      )}
      {activeTab === "List" && (
        <List tasks={tasks} />
      )}
      {activeTab === "Timeline" && (
        <Timeline tasks={tasks} />
      )}
      {activeTab === "Table" && (
        <Table tasks={tasks} />
      )}
      <button
        onClick={() => setIsModalNewTaskOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-500 transition"
        title="Add Task"
        aria-label="Add Task"
      >
        <Plus className="h-6 w-6" />
      </button>
      
    </div>
  );
};

export default Project;
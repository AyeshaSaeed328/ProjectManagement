import { useGetTasksAssignedByUserQuery, useGetTasksAssignedToUserQuery, useUpdateTaskInfoMutation } from "@/state/api";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType } from "@/state/api";
import { EllipsisVertical, MessageSquareMore, Plus } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Status } from "@/state/api";
import { Flag } from "lucide-react";

type BoardProps = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const statusLabels: Record<Status, string> = {
  [Status.TODO]: "To Do",
  [Status.IN_PROGRESS]: "In Progress",
  [Status.DONE]: "Completed",
};
const taskStatus: Status[] = Object.keys(statusLabels) as Status[];


// const taskStatus = ["To Do", "Work In Progress", "Under Review", "Completed"];

const BoardView = ({ id, setIsModalNewTaskOpen }: BoardProps) => {
  const {
    data: res,
    isLoading,
    error,
  } = useGetTasksAssignedByUserQuery();
  const tasks = res?.data || []
  const [updateTaskInfo] = useUpdateTaskInfoMutation();

  const moveTask = (taskId: string, toStatus: Status) => {
  updateTaskInfo({ id: taskId, status: toStatus });
};


  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching tasks</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatus.map((status: Status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks || []}
            moveTask={moveTask}
            setIsModalNewTaskOpen={setIsModalNewTaskOpen}
          />
        ))}
      </div>
    </DndProvider>
  );
};

type TaskColumnProps = {
  status: Status;
  tasks: TaskType[];
  moveTask: (taskId: string, toStatus: Status) => void;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const TaskColumn = ({
  status,
  tasks,
  moveTask,
  setIsModalNewTaskOpen,
}: TaskColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: (monitor: any) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const tasksCount = tasks.filter((task) => task.status === status).length;

  const statusColor: any = {
    IN_PROGRESS: "#2563EB",
    DONE: "#059669",
    TODO: "#D97706",
  };

  return (
    <div
      ref={(instance) => {
        drop(instance);
      }}
      className={`sl:py-4 rounded-lg py-2 xl:px-2 ${isOver ? "bg-purple-100/50 dark:bg-purple-600/10" : ""}`}
    >
      <div className="mb-3 flex w-full">
        <div
          className={`w-2  rounded-s-lg`}
          // style={{ backgroundColor: statusColor[status] }}
        />
        <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-dark-secondary">
          <h3 className="flex items-center text-lg font-semibold dark:text-white">
            {status}{" "}
            <span
              className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
              style={{ width: "1.5rem", height: "1.5rem" }}
            >
              {tasksCount}
            </span>
          </h3>
          <div className="flex items-center gap-1">
            <button className="flex h-6 w-5 items-center justify-center dark:text-neutral-500">
              <EllipsisVertical size={26} />
            </button>
            <button
              className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 dark:bg-dark-tertiary dark:text-white"
              onClick={() => setIsModalNewTaskOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {tasks
        .filter((task) => task.status === status)
        .map((task) => (
          <Task key={task.id} task={task} />
        ))}
    </div>
  );
};

type TaskProps = {
  task: TaskType;
};

const Task = ({ task }: TaskProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id },
    collect: (monitor: any) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const taskTagsSplit = task.tags ? task.tags.split(",") : [];

  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "P")
    : "";
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "P")
    : "";

  const numberOfComments = (task.comments && task.comments.length) || 0;

  const PriorityTag = ({ priority }: { priority: TaskType["priority"] }) => (
    <div
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        priority === "CRITICAL"
          ? " text-red-700"
          : priority === "HIGH"
            ? " text-yellow-700"
            : priority === "MEDIUM"
              ? " text-green-700"
              : priority === "LOW"
                ? " text-blue-700"
                : " text-gray-700"
      }`}
    >
      <div title={priority}>
  <Flag fill="true" size={20} className="cursor-pointer" />
</div>
    </div>
  );

  return (
    <div
      ref={(instance) => {
        drag(instance);
      }}
      className={`mb-4 rounded-md bg-white shadow dark:bg-dark-secondary ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      {/* {task.attachments && task.attachments.length > 0 && (
        // <Image
        //   src="placeholder.png"
        //   alt={task.attachments[0].fileName}
        //   width={400}
        //   height={200}
        //   className="h-auto w-full rounded-t-md"
        // />
      )} */}
      <div className="p-4 md:p-6">
        <div className="flex items-end justify-between">
          <div className="flex flex-1 flex-wrap items-center">
            
            {/* <div className="flex gap-2">
              {taskTagsSplit.map((tag) => (
                <div
                  key={tag}
                  className="rounded-full bg-purple-200 px-2 py-1 text-xs"
                >
                  {" "}
                  {tag}
                </div>
              ))}
            </div> */}
          </div>

          {/* <button className="flex h-6 w-4 flex-shrink-0 items-center justify-center dark:text-neutral-500">
            <EllipsisVertical size={26} />
          </button> */}
        </div>
             
        <div className="mb-3 flex justify-between">
           <div className="mb-3 w-full">
          <div className="flex items-center justify-between">
    <h4 className="text-lg font-bold dark:text-white">{task.title}</h4>
    {/* {typeof task.points === "number" && (
      <div className="text-xs font-semibold dark:text-white">
        {task.points} pts
      </div>
    )} */}
        {task.priority && <PriorityTag priority={task.priority}/>}

  </div>

        <div className="text-xs text-gray-500 dark:text-neutral-500 mt-1">
    {formattedStartDate && <span>{formattedStartDate} - </span>}
    {formattedDueDate && <span>{formattedDueDate}</span>}
  </div></div>
  
        </div>
        <p className="text-sm text-gray-600 dark:text-neutral-500">
          {task.description}
        </p>
        <div className="mt-4 border-t border-gray-200 dark:border-stroke-dark" />

        {/* Users */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-[6px] overflow-hidden">
            {task.taskAssignments?.map((assignment) =>
              assignment.userId ? (
                <Image
                  key={assignment.user.id}
                  src={assignment.user.profilePicture!}
                  alt={assignment.user.username}
                  width={30}
                  height={30}
                  className="h-8 w-8 rounded-full border-2 border-white object-cover dark:border-dark-secondary"
                />
              ) : null
            )}

            {task.author && (
              <Image
                key={task.author.id}
                src={task.author.profilePicture!}
                alt={task.author.username}
                width={30}
                height={30}
                className="h-8 w-8 rounded-full border-2 border-white object-cover dark:border-dark-secondary"
              />
            )}
          </div>
          <div className="flex items-center text-gray-500 dark:text-neutral-500">
            <MessageSquareMore size={20} />
            <span className="ml-1 text-sm dark:text-neutral-400">
              {numberOfComments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardView;
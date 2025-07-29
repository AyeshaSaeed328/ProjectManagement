import { useDeleteTaskMutation, useUpdateTaskInfoMutation, Priority } from "@/state/api";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType } from "@/state/api";
import { EllipsisVertical, MessageSquareMore, Plus } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Status } from "@/state/api";
import { Flag, Pencil, Trash2 } from "lucide-react";
import ModalNewTask from "@/(components)/ModalNewTask";
import { toast } from "sonner";


type BoardProps = {
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  tasks: TaskType[]
};



const statusLabels: Record<Status, string> = {
  [Status.TODO]: "To Do",
  [Status.IN_PROGRESS]: "In Progress",
  [Status.DONE]: "Completed",
};
const taskStatus: Status[] = Object.keys(statusLabels) as Status[];


// const taskStatus = ["To Do", "Work In Progress", "Under Review", "Completed"];

const BoardView = ({ setIsModalNewTaskOpen, tasks }: BoardProps) => {
  console.log("tasks", tasks)


  const [updateTaskInfo] = useUpdateTaskInfoMutation();
  const [selectedTask, setSelectedTask] = React.useState<TaskType | null>(null);
  const moveTask = (taskId: string, toStatus: Status) => {
    updateTaskInfo({ id: taskId, status: toStatus });
  };



  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="flex justify-end">

      </div>

      {/* Task board */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {taskStatus.map((status: Status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasks || []}
              moveTask={moveTask}
              setIsModalNewTaskOpen={setIsModalNewTaskOpen}
              setSelectedTask={setSelectedTask}
            />
          ))}
        </div>
      </DndProvider>
      {selectedTask && (
        <ModalNewTask
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          initialData={{
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description,
            status: selectedTask.status ?? Status.TODO,
            priority: selectedTask.priority ?? Priority.MEDIUM,
            tags: selectedTask.tags,
            startDate: selectedTask.startDate,
            endDate: selectedTask.endDate,
            assignedUserIds: selectedTask.taskAssignments?.map((a) => a.user.id) || [],
          }}
        />
      )}

    </div>


  );
};

type TaskColumnProps = {
  status: Status;
  tasks: TaskType[];
  moveTask: (taskId: string, toStatus: Status) => void;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  setSelectedTask: (task: TaskType | null) => void;
};

const TaskColumn = ({
  status,
  tasks,
  moveTask,
  setIsModalNewTaskOpen,
  setSelectedTask,
}: TaskColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: string }) => moveTask(item.id, status),
    collect: (monitor: any) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const tasksCount = tasks.filter((task) => task.status === status).length;



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
          <Task key={task.id} task={task} onEdit={() => setSelectedTask(task)} />
        ))}

    </div>
  );
};

type TaskProps = {
  task: TaskType;
  onEdit: () => void;
};

const Task = ({ task, onEdit }: TaskProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id },
    collect: (monitor: any) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [deleteTask, { isLoading: isDeleteLoading }] = useDeleteTaskMutation()

  const handleDelete = async (id: string) => {
    try {
      await deleteTask({ id }).unwrap();
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Could not delete project");
      // console.error("Delete failed", error);
    }
  };

  const taskTagsSplit = task.tags ? task.tags.split(",") : [];

  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "P")
    : "";
  const formattedDueDate = task.endDate
    ? format(new Date(task.endDate), "P")
    : "";

  const numberOfComments = (task.comments && task.comments.length) || 0;

  const PriorityTag = ({ priority }: { priority: TaskType["priority"] }) => (
    <div
      className={`rounded-full px-2 py-1 text-xs font-semibold ${priority === "CRITICAL"
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
        <Flag size={20} className="cursor-pointer" />
      </div>
    </div>
  );

  return (
    <div
      ref={(instance) => {
        drag(instance);
      }}
      className={`mb-4 rounded-md bg-white shadow dark:bg-dark-secondary ${isDragging ? "opacity-50" : "opacity-100"
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
              {task.priority && <PriorityTag priority={task.priority} />}


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
                  title={assignment.user.username}
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
                title={task.author.username}
                width={30}
                height={30}
                className="h-8 w-8 rounded-full border-2 border-white object-cover dark:border-dark-secondary"
              />
            )}
          </div>
          <div className="flex items-center justify-end  text-gray-500 dark:text-neutral-500 gap-2">
            <div className="flex items-center space-x-3">
              {/* 💬 Comment Icon + Count */}
              <div className="relative group inline-flex items-center">
                <MessageSquareMore
                  size={16}
                  aria-label="Comments"
                  className="cursor-pointer hover:text-purple-700 dark:hover:text-purple-700"
                />
                <span className="ml-1 text-sm dark:text-neutral-400">
                  {numberOfComments}
                </span>
                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  View Comments
                </span>
              </div>

              {/* ✏️ Edit Button */}
              <div className="relative group inline-block">
                <button onClick={onEdit} className="relative z-10">
                  <Pencil
                    size={16}
                    aria-label="Edit Task"
                    className="cursor-pointer hover:text-purple-700 dark:hover:text-purple-700"
                  />
                </button>
                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  Edit Task
                </span>
              </div>

              <div className="relative group inline-block">
                <button onClick={() => handleDelete(task.id)} className="relative z-10">
                  <Trash2
                    size={16}
                    aria-label="Delete Task"
                    className="cursor-pointer hover:text-purple-700 dark:hover:text-purple-700"
                  />
                </button>
                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  Delete Task
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default BoardView;
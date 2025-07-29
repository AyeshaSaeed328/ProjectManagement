import Modal from "../Modal";
import {
  Priority,
  Status,
  useCreateTaskMutation,
  useUpdateTaskInfoMutation,
  useAssignUsersToTaskMutation,
  useGetUsersQuery,
} from "@/state/api";
import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { formatISO } from "date-fns";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string;
  initialData?: {
    id: string;
    title: string;
    description?: string;
    status: Status;
    priority: Priority;
    tags?: string;
    startDate?: string;
    endDate?: string;
    assignedUserIds: string[];
  };
};

type FormData = {
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  tags?: string;
  startDate?: string;
  dueDate?: string;
  assignedUsers: { label: string; value: string }[];
};

const ModalNewTask = ({ isOpen, onClose, id, initialData }: Props) => {
  const isEditing = !!initialData;

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskInfoMutation();
  const [assignUsersToTask, { isLoading: isAssigning }] = useAssignUsersToTaskMutation();
  const { data: userRes } = useGetUsersQuery();
  const users = userRes?.data || [];

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  // ✅ Prevent unnecessary resets
  const lastResetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialData && users.length > 0 && initialData.id !== lastResetIdRef.current) {
      const matchedUsers = users
        .filter((u) => initialData.assignedUserIds.includes(u.id))
        .map((u) => ({ label: u.username, value: u.id }));

      reset({
        title: initialData.title,
        description: initialData.description || "",
        status: initialData.status,
        priority: initialData.priority,
        tags: initialData.tags || "",
        startDate: initialData.startDate?.slice(0, 10) || "",
        dueDate: initialData.endDate?.slice(0, 10) || "",
        assignedUsers: matchedUsers,
      });

      lastResetIdRef.current = initialData.id;
    } else if (!initialData && lastResetIdRef.current !== null) {
      reset(); // switching from edit to create
      lastResetIdRef.current = null;
    }
  }, [initialData, users, reset]);

  const onSubmit = async (data: FormData) => {
    const formattedStartDate = data.startDate
      ? formatISO(new Date(data.startDate), { representation: "complete" })
      : undefined;

    const formattedDueDate = data.dueDate
      ? formatISO(new Date(data.dueDate), { representation: "complete" })
      : undefined;

    let taskId = "";

    if (isEditing && initialData) {
      await updateTask({
        id: initialData.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        tags: data.tags,
        startDate: formattedStartDate,
        endDate: formattedDueDate,
      }).unwrap();
      taskId = initialData.id;
    } else {
      const res = await createTask({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        tags: data.tags,
        startDate: formattedStartDate,
        endDate: formattedDueDate,
        projectId: id,
        points: 10,
      }).unwrap();
      taskId = res.data.id;
    }

    if (data.assignedUsers.length > 0) {
      await assignUsersToTask({
        taskId,
        userIds: data.assignedUsers.map((u) => u.value),
      });
    }

    onClose();
  };

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const selectStyles =
    "mb-4 block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const userOptions = users.map((u) => ({ label: u.username, value: u.id }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} name={isEditing ? "Edit Task" : "Create Task"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input className={inputStyles} placeholder="Title" {...register("title", { required: true })} />
        <textarea className={inputStyles} placeholder="Description" {...register("description")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <select className={selectStyles} {...register("status", { required: true })}>
            <option value="">Select Status</option>
            {Object.values(Status).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select className={selectStyles} {...register("priority", { required: true })}>
            <option value="">Select Priority</option>
            {Object.values(Priority).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <input className={inputStyles} placeholder="Tags (comma separated)" {...register("tags")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="date" className={inputStyles} {...register("startDate")} />
          <input type="date" className={inputStyles} {...register("dueDate")} />
        </div>

        <Controller
          control={control}
          name="assignedUsers"
          render={({ field }) => (
            <Select
              {...field}
              isMulti
              options={userOptions}
              placeholder="Assign users..."
              classNamePrefix="react-select"
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: 'var(--select-bg)',
                  borderColor: state.isFocused ? '#9333ea' : 'var(--select-border)',
                  boxShadow: state.isFocused ? '0 0 0 1px #9333ea' : 'none',
                  '&:hover': {
                    borderColor: '#9333ea',
                  },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'var(--select-bg)',
                  zIndex: 50,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? '#9333ea'
                    : state.isFocused
                    ? '#a855f7'
                    : 'var(--select-bg)',
                  color: state.isSelected || state.isFocused ? 'white' : 'var(--select-text)',
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#9333ea',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: 'white',
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: 'white',
                  ':hover': {
                    backgroundColor: '#7c3aed',
                    color: 'white',
                  },
                }),
              }}
            />
          )}
            />
        

        <button
          type="submit"
          disabled={isCreating || isUpdating || isAssigning}
          className="mt-4 w-full rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isEditing
            ? isUpdating ? "Updating..." : "Update Task"
            : isCreating ? "Creating..." : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;



































// import Modal from "../Modal";
// import {
//   Priority,
//   Status,
//   useCreateTaskMutation,
//   useAssignUsersToTaskMutation,
//   useGetUsersQuery,
// } from "@/state/api";
// import React from "react";
// import { useForm, Controller } from "react-hook-form";
// import Select from "react-select";
// import { formatISO } from "date-fns";


// type Props = {
//   isOpen: boolean;
//   onClose: () => void;
//   id?: string | undefined;

// };

// type FormData = {
//   title: string;
//   description?: string;
//   status: Status;
//   priority: Priority;
//   tags?: string;
//   startDate?: string;
//   dueDate?: string;
//   authorId: string;
//   assignedUsers: { label: string; value: string }[];
//   // projectId?: string;
// };

// const ModalNewTask = ({ isOpen, onClose, id }: Props) => {


//   const [createTask, { isLoading }] = useCreateTaskMutation();
//   const [assignUsersToTask, { isLoading: isAssigning }] = useAssignUsersToTaskMutation();
//   const { data: userRes } = useGetUsersQuery();
//   const users = userRes?.data || [];

//   const {
//     control,
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<FormData>({
//     defaultValues: {
//       status: Status.TODO,
//       priority: Priority.MEDIUM,
//     },
//   });

//   const onSubmit = async (data: FormData) => {
//     const formattedStartDate = data.startDate
//       ? formatISO(new Date(data.startDate), { representation: "complete" })
//       : undefined;
//     const formattedDueDate = data.dueDate
//       ? formatISO(new Date(data.dueDate), { representation: "complete" })
//       : undefined;

//     const taskRes = await createTask({
//       title: data.title,
//       description: data.description,
//       status: data.status,
//       priority: data.priority,
//       startDate: formattedStartDate,
//       endDate: formattedDueDate,
//       tags: data.tags,
//       projectId: id,
//       points:10
//     }).unwrap();

//     if (data.assignedUsers.length > 0) {
//       await assignUsersToTask({
//         taskId: taskRes.data.id,
//         userIds: data.assignedUsers.map((user) => user.value),
//       });
//     }

//     onClose(); 
//   };

//   const selectStyles =
//     "mb-4 block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

//   const inputStyles =
//     "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

//   const userOptions = users.map((user) => ({
//     label: user.username,
//     value: user.id,
//   }));

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
//       <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
//         <input
//           className={inputStyles}
//           placeholder="Title"
//           {...register("title", { required: true })}
//         />

//         <textarea
//           className={inputStyles}
//           placeholder="Description"
//           {...register("description")}
//         />

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//           <select className={selectStyles} {...register("status", { required: true })}>
//             <option value="">Select Status</option>
//             {Object.values(Status).map((s) => (
//               <option key={s} value={s}>
//                 {s}
//               </option>
//             ))}
//           </select>

//           <select className={selectStyles} {...register("priority", { required: true })}>
//             <option value="">Select Priority</option>
//             {Object.values(Priority).map((p) => (
//               <option key={p} value={p}>
//                 {p}
//               </option>
//             ))}
//           </select>
//         </div>

//         <input className={inputStyles} placeholder="Tags (comma separated)" {...register("tags")} />

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//           <input type="date" className={inputStyles} {...register("startDate")} />
//           <input type="date" className={inputStyles} {...register("dueDate")} />
//         </div>

//         {/* <input
//           type="text"
//           className={inputStyles}
//           placeholder="Author User ID"
//           {...register("authorId", { required: true })}
//         /> */}

//         {/* {id === null && (
//           <input
//             type="text"
//             className={inputStyles}
//             placeholder="Project ID"
//             {...register("projectId")}
//           />
//         )} */}

//         <Controller
//   control={control}
//   name="assignedUsers"
//   render={({ field }) => (
//     <Select
//       {...field}
//       options={userOptions}
//       isMulti
//       placeholder="Assign users..."
//       className="react-select-container"
//       classNamePrefix="react-select"
//       styles={{
//   control: (base, state) => ({
//     ...base,
//     backgroundColor: 'var(--select-bg)',
//     borderColor: state.isFocused ? '#9333ea' : 'var(--select-border)',
//     boxShadow: state.isFocused ? '0 0 0 1px #9333ea' : 'none',
//     '&:hover': {
//       borderColor: '#9333ea',
//     },
//   }),
//   menu: (base) => ({
//     ...base,
//     backgroundColor: 'var(--select-bg)',
//     zIndex: 50,
//   }),
//   menuList: (base) => ({
//     ...base,
//     backgroundColor: 'var(--select-bg)',
//   }),
//   option: (base, state) => ({
//     ...base,
//     backgroundColor: state.isSelected
//       ? '#9333ea'
//       : state.isFocused
//       ? '#a855f7'
//       : 'var(--select-bg)',
//     color: state.isSelected || state.isFocused ? 'white' : 'var(--select-text)',
//     ':active': {
//       backgroundColor: '#7c3aed', // purple-700
//     },
//   }),
//   singleValue: (base) => ({
//     ...base,
//     color: 'var(--select-text)',
//   }),
//   placeholder: (base) => ({
//     ...base,
//     color: 'var(--select-text)',
//   }),
//   multiValue: (base) => ({
//     ...base,
//     backgroundColor: '#9333ea',
//   }),
//   multiValueLabel: (base) => ({
//     ...base,
//     color: 'white',
//   }),
//   multiValueRemove: (base) => ({
//     ...base,
//     color: 'white',
//     ':hover': {
//       backgroundColor: '#7c3aed',
//       color: 'white',
//     },
//   }),
// }}


//     />
//   )}
// />


//         <button
//           type="submit"
//           className="mt-4 w-full rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
//           disabled={isLoading || isAssigning}
//         >
//           {isLoading ? "Creating..." : "Create Task"}
//         </button>
//       </form>
//     </Modal>
//   );
// };

// export default ModalNewTask;

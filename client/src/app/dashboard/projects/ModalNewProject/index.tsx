


import Modal from "@/(components)/Modal";
import React, { useEffect } from "react";
import { useCreateProjectMutation, useGetTeamsQuery, useAssignTeamsToProjectsMutation } from "@/state/api";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id: string;
    name: string;
    description?: string;
    tags?: string;
    startDate?: string;
    endDate?: string;
  };
};

type FormData = {
  name: string;
  description?: string;
  tags?: string;
  startDate?: string;
  endDate?: string;
  teams?: { label: string; value: string }[];
};

const ModalNewProject = ({ isOpen, onClose, initialData }: Props) => {
  const isEditing = Boolean(initialData);

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  // const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [assignTeams, { isLoading: isAssigning }] = useAssignTeamsToProjectsMutation();
  const {data:teamsRes, isLoading:isTeamsLoading, isError} = useGetTeamsQuery();
  const teams = teamsRes?.data ?? []

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      tags: "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || "",
        tags: initialData.tags || "",
        startDate: initialData.startDate?.slice(0, 10), // to match input type="date"
        endDate: initialData.endDate?.slice(0, 10),
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      tags: data.tags || undefined,
    };

    // if (isEditing && initialData?.id) {
    //   await updateProject({ id: initialData.id, ...payload });
    // } else {
    //   await createProject({ ...payload });
    // }
    const createdProject = await createProject({ ...payload }).unwrap();
    
    if (data.teams?.length) {
  await assignTeams({
    projectId: createdProject.data.id,
    teamIds: data.teams.map((team) => team.value),
  });
}


    onClose();
    reset(); // optional
  };
  const teamOptions = teams.map((team) => ({
    label: team.teamName,
    value: team.id
  }));

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  return (
    <Modal isOpen={isOpen} onClose={onClose} name={isEditing ? "Edit Project" : "Create New Project"}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input
          className={inputStyles}
          placeholder="Project Name"
          {...register("name", { required: true })}
        />

        <textarea
          className={inputStyles}
          placeholder="Description"
          {...register("description")}
        />

        <input
          className={inputStyles}
          placeholder="Tags (comma separated)"
          {...register("tags")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="date" className={inputStyles} {...register("startDate")} />
          <input type="date" className={inputStyles} {...register("endDate")} />
        </div>

        <Controller
          control={control}
          name="teams"
          render={({ field }) => (
            <Select
              {...field}
              options={teamOptions}
              isMulti
              placeholder="Assign teams..."
              className="react-select-container"
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
          menuList: (base) => ({
            ...base,
            backgroundColor: 'var(--select-bg)',
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? '#9333ea'
              : state.isFocused
              ? '#a855f7'
              : 'var(--select-bg)',
            color: state.isSelected || state.isFocused ? 'white' : 'var(--select-text)',
            ':active': {
              backgroundColor: '#7c3aed', // purple-700
            },
          }),
          singleValue: (base) => ({
            ...base,
            color: 'var(--select-text)',
          }),
          placeholder: (base) => ({
            ...base,
            color: 'var(--select-text)',
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
          className="mt-4 w-full rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
          disabled={isCreating }
        >
          {isCreating  ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Project" : "Create Project"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewProject;


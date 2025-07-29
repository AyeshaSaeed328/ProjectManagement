import Modal from "@/(components)/Modal";
import React, { useEffect } from "react";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useAssignTeamsToProjectsMutation,
  useGetTeamsQuery,
} from "@/state/api";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { useRef } from "react";

type TeamOption = { label: string; value: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    managerId?: string
    teams?: { teamId: string; projectId: string }[];
  };
};

type FormData = {
  name: string;
  description?: string;
  // tags?: string;
  startDate?: string;
  endDate?: string;
  teams?: TeamOption[];
};

const ModalNewProject = ({ isOpen, onClose, initialData }: Props) => {
  const isEditing = Boolean(initialData);
const lastResetIdRef = useRef<string | null>(null);

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [assignTeams, { isLoading: isAssigning }] = useAssignTeamsToProjectsMutation();
  const { data: teamsRes, isLoading: isTeamsLoading } = useGetTeamsQuery();
  const teams = teamsRes?.data ?? [];

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
      // tags: "",
      startDate: "",
      endDate: "",
      teams: [],
    },
  });

useEffect(() => {
  if (initialData && initialData.id !== lastResetIdRef.current && teams.length > 0) {
    const matchedTeams =
      initialData.teams?.map((rel) => {
        const fullTeam = teams.find((t) => t.id === rel.teamId);
        return fullTeam
          ? { label: fullTeam.teamName, value: fullTeam.id }
          : null;
      }).filter(Boolean) ?? [];

    reset({
      name: initialData.name,
      description: initialData.description || "",
      startDate: initialData.startDate?.slice(0, 10),
      endDate: initialData.endDate?.slice(0, 10),
      teams: matchedTeams as TeamOption[],
    });

    lastResetIdRef.current = initialData.id;
  } else if (!initialData && lastResetIdRef.current !== null) {
    reset(); // switching from edit to create
    lastResetIdRef.current = null;
  }
}, [initialData, teams, reset]);


  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      teamIds: data.teams?.map((team) => team.value) ?? [],
    };

    try {
      let projectId: string;

      if (isEditing && initialData?.id) {
        await updateProject({ id: initialData.id, ...payload }).unwrap();
        projectId = initialData.id;
      } else {
        const created = await createProject(payload).unwrap();
        projectId = created.data.id;
        if (data.teams?.length) {
        await assignTeams({
          projectId,
          teamIds: data.teams.map((team) => team.value),
        });
      }
      }

      

      onClose();
      reset();
    } catch (error) {
      console.error("Project creation/update failed:", error);
    }
  };

  const teamOptions: TeamOption[] = teams.map((team) => ({
    label: team.teamName,
    value: team.id,
  }));

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      name={isEditing ? "Edit Project" : "Create New Project"}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <input
          className={inputStyles}
          placeholder="Project Name"
          {...register("name", { required: "Project name is required" })}
        />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}

        <textarea
          className={inputStyles}
          placeholder="Description"
          {...register("description")}
        />

        {/* <input
          className={inputStyles}
          placeholder="Tags (comma separated)"
          {...register("tags")}
        /> */}

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
              isMulti
              options={teamOptions}
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
          {isCreating || isUpdating
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Update Project"
            : "Create Project"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewProject;

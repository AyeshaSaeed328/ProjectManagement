import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchBaseQueryWithReauth } from "./fetchBaseQueryWithReauth";
import { log } from "console";

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
  Backlog = "Backlog",
}

export enum Status {
  ToDo = "To Do",
  WorkInProgress = "Work In Progress",
  UnderReview = "Under Review",
  Completed = "Completed",
}

export interface User {
  userId?: string;
  username: string;
  email: string;
  profilePictureUrl?: string;
  passwordHash: string;
  refreshToken?: string;
  teamId?: string;
}

export interface Attachment {
  id: string;
  fileURL: string;
  fileName: string;
  taskId: string;
  uploadedById: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string;
  startDate?: string;
  dueDate?: string;
  points?: number;
  projectId: string;
  authorUserId?: string;
  assignedUserId?: string;

  author?: User;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface SearchResults {
  tasks?: Task[];
  projects?: Project[];
  users?: User[];
}

export interface Team {
  teamId: string;
  teamName: string;
  productOwnerUserId?: string;
  projectManagerUserId?: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorUserId: string;
  createdAt: string;
  updatedAt?: string;
}

export const api = createApi({
  baseQuery: fetchBaseQueryWithReauth,
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams", "Auth"],
  endpoints: (build) => ({

    registerUser: build.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: "users/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users", "Auth"],
    }),

    loginUser: build.mutation<
      { user: User },
      { email?: string; username?: string; password: string }
    >({
      query: (credentials) => ({
        url: "users/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    logoutUser: build.mutation<void, void>({
      query: () => ({
        url: "users/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    getAuthUser: build.query<User, void>({
      query: () => "users/current-user",
      providesTags: ["Auth"],
    }),
    updateUserDetails: build.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: "users/update",
        method: "PATCH",
        body: userData,
      }),
      invalidatesTags: ["Auth", "Users"],
    }),
    changeCurrentPassword: build.mutation<void, { oldPassword: string; newPassword: string }>({
      query: (passwords) => ({
        url: "users/change-password",
        method: "POST",
        body: passwords,
      }),
      invalidatesTags: ["Auth"],
    }),
    resetPassword: build.mutation<void, { email: string }>({
      query: (email) => ({
        url: "users/reset-password",
        method: "POST",
        body: email,
      }),
      invalidatesTags: ["Auth"],
    }),
    verifyEmail: build.mutation<void, { token: string }>({
      query: (token) => ({
        url: "users/verify-email",
        method: "POST",
        body: { token },
      }),
      invalidatesTags: ["Auth"],
    }),
    resendVerificationEmail: build.mutation<void, { email: string }>({
      query: (email) => ({
        url: "users/resend-verification-email",
        method: "POST",
        body: email,
      }),
      invalidatesTags: ["Auth"],
    }),


    getProjects: build.query<Project[], void>({
      query: () => "projects/all",
      providesTags: ["Projects"],
    }),
    createProject: build.mutation<Project, Partial<Project>>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    getTasks: build.query<Task[], { projectId: number }>({
      query: ({ projectId }) => `tasks?projectId=${projectId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: "Tasks" as const, id }))
          : [{ type: "Tasks" as const }],
    }),
    getTasksByUser: build.query<Task[], number>({
      query: (userId) => `tasks/user/${userId}`,
      providesTags: (result, error, userId) =>
        result
          ? result.map(({ id }) => ({ type: "Tasks", id }))
          : [{ type: "Tasks", id: userId }],
    }),
    createTask: build.mutation<Task, Partial<Task>>({
      query: (task) => ({
        url: "tasks",
        method: "POST",
        body: task,
      }),
      invalidatesTags: ["Tasks"],
    }),
    updateTaskStatus: build.mutation<Task, { taskId: number; status: string }>({
      query: ({ taskId, status }) => ({
        url: `tasks/${taskId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),
    getTeams: build.query<Team[], void>({
      query: () => "teams",
      providesTags: ["Teams"],
    }),
    search: build.query<SearchResults, string>({
      query: (query) => `search?query=${query}`,
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useGetAuthUserQuery,
  useUpdateUserDetailsMutation,
  useChangeCurrentPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,

  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useSearchQuery,
  useGetUsersQuery,
  useGetTeamsQuery,
  useGetTasksByUserQuery,
  // useGetAuthUserQuery,
  
} = api;
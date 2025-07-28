import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQueryWithReauth } from "./fetchBaseQueryWithReauth";



export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  managerId: string;
  manager: User
}

// api.ts or types.ts (wherever you define types)

export enum Status {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum ProjectStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
}

export enum UserLoginType {
  EMAIL_PASSWORD = "EMAIL_PASSWORD",
  GOOGLE = "GOOGLE",
  GITHUB = "GITHUB",
}

export enum UserRole {
  MANAGER = "MANAGER",
  USER = "USER",
}


export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  refreshToken?: string;
  teamId?: string;
  isEmailVerified?: boolean;
  role?: UserRole;
  loginType?: UserLoginType;

  
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
  endDate?: string;
  points?: number;
  projectId: string;
  authorId?: string;
  taskAssignments: TaskAssignment[];
  // assignedUserId?: string;

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
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export interface TaskAssignment{
  id: string
  userId: string
  taskId: string
  user: User
}


export const api = createApi({
  baseQuery: fetchBaseQueryWithReauth,
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams", "Auth"],
  endpoints: (build) => ({

    registerUser: build.mutation<ApiResponse<{ user: User }>,
    Partial<User>>({
      query: (userData) => ({
        url: "users/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users", "Auth"],
    }),

    loginUser: build.mutation<
      ApiResponse<{ user: User }>,
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

    getAuthUser: build.query<ApiResponse<User>, void>({
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
    forgotPassword: build.mutation<void, { email: string }>({
  query: (body) => ({
    url: "users/forgot-password",
    method: "POST",
    body,
  }),
}),
resetPassword: build.mutation<void, { resetToken: string; newPassword: string }>({
  query: ({ resetToken, newPassword }) => ({
    url: `users/reset-password/${resetToken}`,
    method: "POST",
    body: { newPassword },
  }),
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


    getProjects: build.query<ApiResponse<Project[]>, void>({
      query: () => "projects/user",
      providesTags: ["Projects"],
    }),
    getProjectById: build.query<ApiResponse<Project>, string>({
      query: (id) => `projects/${id}`,
      providesTags: (result) =>
        result ? [{ type: "Projects", id: result.data.id }] : [],
    }),
    createProject: build.mutation<ApiResponse<Project>, Partial<Project>>({
      query: (project) => ({
        url: "projects/create",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    deleteProject: build.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `projects/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    // getTasks: build.query<Task[], { projectId: string }>({
    //   query: ({ projectId }) => `tasks?projectId=${projectId}`,
    //   providesTags: (result) =>
    //     result
    //       ? result.map(({ id }) => ({ type: "Tasks" as const, id }))
    //       : [{ type: "Tasks" as const }],
    // }),
    getTasksAssignedByUser: build.query<ApiResponse<Task[]>, void>({
  query: () => "tasks/assigned-by-me",
  providesTags: (result) =>
    result
      ? result.data.map(({ id }) => ({ type: "Tasks" as const, id }))
      : [{ type: "Tasks" as const }],
}),

getTasksAssignedToUser: build.query<ApiResponse<Task[]>, void>({
  query: () => "tasks/assigned-to-me",
  providesTags: (result) =>
    result
      ? result.data.map(({ id }) => ({ type: "Tasks" as const, id }))
      : [{ type: "Tasks" as const }],
}),
getAllTasksFromProject: build.query<ApiResponse<Task[]>, string>({
  query: (projectId) => `tasks/${projectId}`,
  providesTags: (result) =>
    result?.data
      ? result.data.map((task) => ({ type: "Tasks" as const, id: task.id }))
      : [{ type: "Tasks" }],
}),



    createTask: build.mutation<ApiResponse<Task>, Partial<Task>>({
  query: (task) => ({
    url: `tasks/create`, // ✅ no /:projectId in the URL
    method: "POST",
    body: task, // ✅ projectId will be read from the body
  }),
  invalidatesTags: ["Tasks"],
}),

    updateTaskInfo: build.mutation<Task, Partial<Task>>({
      query: (data) => ({
        url: `tasks/update`,
        method: "PATCH",
        body: { ...data },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Tasks", id },
      ],
    }),
    assignUsersToTask: build.mutation<ApiResponse<TaskAssignment[]>, { taskId: string; userIds: string[] }>({
  query: ({ taskId, userIds }) => ({
    url: "tasks/add-users",
    method: "POST",
    body: { taskId, userIds },
  }),
  invalidatesTags: (result, error, { taskId }) => [
    { type: "Tasks", id: taskId },
    "Users",
  ],
}),

    getUsers: build.query<ApiResponse<User[]>, void>({
      query: () => "users/all",
      providesTags: ["Users"],
    }),
    getTeams: build.query<ApiResponse<Team[]>, void>({
      query: () => "teams/all",
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
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,

  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetTasksAssignedByUserQuery,
  useGetTasksAssignedToUserQuery,
  useGetAllTasksFromProjectQuery,
  useCreateTaskMutation,
  useUpdateTaskInfoMutation,
  useAssignUsersToTaskMutation,
  useSearchQuery,
  useGetUsersQuery,
  useGetTeamsQuery,
} = api;
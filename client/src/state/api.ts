import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQueryWithReauth } from "./fetchBaseQueryWithReauth";
import axios from "axios";


export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  managerId: string;
  manager: User;
  teams: ProjectTeams[];
}


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
  url: string;
  fileName: string;
  taskId?: string;
  uploadedById: string;
  messageId?: string;
  message?: Message;
  fileType: string;
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
  id: string;
  teamName: string;
  teamLeadId: string;
  teamLead: Partial<User>;
  members: User[];
}

export interface ProjectTeams {
  projectId: string;
  teamId: string;
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

export interface TaskAssignment {
  id: string
  userId: string
  taskId: string
  user: User
}
interface UpdateProjectInput extends Partial<Project> {
  teamIds?: string[];
}
export interface ChatInterface {
  admin?: User;
  adminId?: string;
  createdAt: Date;
  isGroupChat: boolean;
  lastMessage?: Message;
  name: string;
  participants: User[];
  updatedAt: Date;
  id: string;
  messages?: Message[];
  lastMessageAt?: Date;
}

export interface Message {
  id: string;
  sender: Pick<User, "id" | "profilePicture" | "email" | "username">;
  content: string;
  chat: ChatInterface;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}



export const api = createApi({
  baseQuery: fetchBaseQueryWithReauth,
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams", "Auth", "Messages", "Chats"],
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
    updateProject: build.mutation<ApiResponse<Project>, UpdateProjectInput>({
      query: (project) => ({
        url: `projects/update/${project.id}`,
        method: "PATCH",
        body: project,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Projects",
        "Teams",
      ],
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
    getTaskById: build.query<ApiResponse<Task>, string>({
      query: (id) => `tasks/${id}`,
      providesTags: (result) =>
        result ? [{ type: "Tasks", id: result.data.id }] : [],
    }),



    createTask: build.mutation<ApiResponse<Task>, Partial<Task>>({
      query: (task) => ({
        url: `tasks/create`,
        method: "POST",
        body: task,
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

    deleteTask: build.mutation<ApiResponse<null>, { id: string }>({
      query: ({ id }) => ({
        url: `tasks/delete/${id}`,
        method: "DELETE",
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

    assignTeamsToProjects: build.mutation<ApiResponse<ProjectTeams[]>, { projectId: string; teamIds: string[] }>({
      query: ({ projectId, teamIds }) => ({
        url: "project-team/assign",
        method: "POST",
        body: { projectId, teamIds }
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Projects", id: projectId },
        "Teams",
      ]

    }),
    getUserTeam: build.query<ApiResponse<Team>, void>({
      query: () => `teams/me`,
      providesTags: (result) =>
        result?.data
          ? [{ type: "Teams" as const, id: result.data.id }]
          : [{ type: "Teams" }],
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

    // Chat Module APIs

    getAllChats: build.query<ApiResponse<ChatInterface[]>, void>({
      query: () => "chats",
      providesTags: (result) =>
        result?.data
          ? [
            { type: "Chats" as const, id: "LIST" },
            ...result.data.map((chat) => ({ type: "Chats" as const, id: chat.id })),
          ]
          : [{ type: "Chats" as const, id: "LIST" }],
    }),

    createOneOnOneChat: build.mutation<ApiResponse<ChatInterface>, { receiverId: string }>({
      query: ({ receiverId }) => ({
        url: `chats/c/${receiverId}`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Chats", id: "LIST" }],
    }),
    createGroupChat: build.mutation<ApiResponse<ChatInterface>, { name: string; participantIds: string[] }>({
      query: ({ name, participantIds }) => ({
        url: "chats/group",
        method: "POST",
        body: { name, participantIds },
      }),
      invalidatesTags: [{ type: "Chats", id: "LIST" }],
    }),
    getAllUsers: build.query<ApiResponse<User[]>, void>({
      query: () => "users/all",
      providesTags: ["Users"],
    }),

  
    getMessagesByChat: build.query<ApiResponse<Message[]>, string>({
  query: (chatId) => `messages/${chatId}`,
  providesTags: (result, error, chatId) =>
    result?.data
      ? [
          ...result.data.map((message) => ({ type: "Messages" as const, id: message.id })),
          { type: "Messages" as const, id: `CHAT_${chatId}` },
        ]
      : [{ type: "Messages" as const, id: `CHAT_${chatId}` }],
}),

   

sendMessage: build.mutation<
  ApiResponse<Message>,
  {
    chatId: string;
    content: string;
    attachments?: File[];
    onUploadProgress?: (progress: number) => void;
  }
>({
  queryFn: async ({ chatId, content, attachments, onUploadProgress }) => {
    const formData = new FormData();
    formData.append("content", content);
    attachments?.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      const res = await axios.post<ApiResponse<Message>>(
        `http://localhost:4000/api/v1/messages/${chatId}`,
        formData,
        {
          withCredentials: true,
          onUploadProgress: (evt) => {
            if (onUploadProgress) {
              const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
              onUploadProgress(percent);
            }
          },
        }
      );

      return { data: res.data };
    } catch (error: any) {
      return { error: { status: error.response?.status, data: error.response?.data } };
    }
  },
 invalidatesTags: (result, error, { chatId }) => [{ type: "Messages", id: `CHAT_${chatId}` }],

}),

    renameGroupChat: build.mutation<ApiResponse<ChatInterface>, { chatId: string; name: string }>({
      query: ({ chatId, name }) => ({
        url: `chats/rename/group/${chatId}`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Chats", id: "LIST" },
        { type: "Chats", id: chatId },
      ],

    }),
    leaveGroupChat: build.mutation<ApiResponse<null>, { chatId: string }>({
      query: ({ chatId }) => ({
        url: `chats/leave/group/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Chats", id: "LIST" },
        { type: "Chats", id: chatId },
      ],

    }),
    addUserToGroupChat: build.mutation<
      ApiResponse<ChatInterface>,
      { chatId: string; participantIds: string[] }
    >({
      query: ({ chatId, participantIds }) => ({
        url: `chats/add/group/${chatId}`,
        method: "POST",
        body: { participantIds },
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Chats", id: "LIST" },
        { type: "Chats", id: chatId },
      ],

    }),


    removeUserFromGroupChat: build.mutation<ApiResponse<ChatInterface>, { chatId: string; participantId: string }>({
      query: ({ chatId, participantId }) => ({
        url: `chats/remove/group/${chatId}/${participantId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Chats", id: "LIST" },
        { type: "Chats", id: chatId },
      ],

    }),

    deleteMessage: build.mutation<ApiResponse<Message>, { messageId: string }>({
      query: ({ messageId }) => ({
        url: `messages/${messageId}`,
        method: "DELETE",
        
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: "Messages", id: messageId },
      ],
    }),

    deleteGroupChat: build.mutation<ApiResponse<null>, { chatId: string }>({
      query: ({ chatId }) => ({
        url: `chats/group/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Chats", id: "LIST" },
      ],
    }),

    deleteOneOnOneChat: build.mutation<ApiResponse<null>, { chatId: string }>({
      query: ({ chatId }) => ({
        url: `chats/one-on-one/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Chats", id: "LIST" },
      ],
    }),

  }),
})

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
  useUpdateProjectMutation,
  useGetTasksAssignedByUserQuery,
  useGetTasksAssignedToUserQuery,
  useGetAllTasksFromProjectQuery,
  useGetTaskByIdQuery,
  useDeleteTaskMutation,
  useCreateTaskMutation,
  useUpdateTaskInfoMutation,
  useAssignUsersToTaskMutation,
  useSearchQuery,
  useGetUsersQuery,
  useGetTeamsQuery,
  useAssignTeamsToProjectsMutation,
  useGetUserTeamQuery,

  // Chat Module APIs
  useGetAllChatsQuery,
  useCreateOneOnOneChatMutation,
  useCreateGroupChatMutation,
  useGetAllUsersQuery,
  useLazyGetMessagesByChatQuery,
  useSendMessageMutation,
  useRenameGroupChatMutation,
  useLeaveGroupChatMutation,
  useAddUserToGroupChatMutation,
  useRemoveUserFromGroupChatMutation,
  useDeleteMessageMutation,
  useDeleteGroupChatMutation,
  useDeleteOneOnOneChatMutation

} = api;
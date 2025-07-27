import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma } from "@prisma/client";
import { Task, TaskAssignment } from "@prisma/client";

const prisma = new PrismaClient();


const getTasksAssignedByUser = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Task[]>>> => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }

    const tasks = await prisma.task.findMany({
      where: { authorId: userId },
      include: {
        project: true,
        author: {
      select: {
        id: true,
        username: true,
        profilePicture: true,
      },
    },
    taskAssignments: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    },
        comments: true,
        attachments: true,
      },
    });

    if (!tasks || tasks.length === 0) {
      throw new ApiError(404, "No tasks found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse<Task[]>(
          200,
          tasks,
          "User tasks fetched successfully"
        )
      );
  }
);

const getTasksAssignedToUser = asyncHandler(
  async (req:Request, res: Response): Promise<Response<ApiResponse<Task[]>>> =>{
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(400, "User ID is required");
    }
    const tasks = await prisma.task.findMany({
      where: {
        taskAssignments: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        project: true,
        author: {
      select: {
        id: true,
        username: true,
        profilePicture: true,
      },
    },
    taskAssignments: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    },
        comments: true,
        attachments: true,
      }
    });
    return res.status(200).json(new ApiResponse<Task[]>(200, tasks, "User tasks fetched successfully"));

  }
)

const getTasksByProjectId = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Task[]>>> =>
  {
    const projectId = req.params.projectId;
    if (!projectId) {
      throw new ApiError(400, "Project ID is required");
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        project: true,
        author: {
      select: {
        id: true,
        username: true,
        profilePicture: true,
      },
    },
    taskAssignments: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    },
        comments: true,
        attachments: true,
      },
    
    })
    return res.status(200).json(new ApiResponse<Task[]>(200, tasks, "Tasks fetched successfully"));
  })

const createTask = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Task>>> => {
    const authorId = req.user?.id;
    
    if (!authorId) {
      throw new ApiError(400, "Author ID is required");
    }
    const {
      title,
      description,
      priority,
      status,
      tags,
      startDate,
      endDate,
      points,
      projectId,
      assignedUserIds = [],
    } = req.body;
    if (!title || !projectId || !priority || !status) {
      throw new ApiError(400, "Missing required fields");
    }
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status,
        tags,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        points,
        projectId,
        authorId,
        taskAssignments: {
          create: assignedUserIds.map((userId: string) => ({ userId })),
        },
      },
      include: {
        taskAssignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task) {
      throw new ApiError(500, "Failed to create task");
    }

    return res.status(201).json(new ApiResponse<Task>(201, task, "Task created successfully"));
  }
);

const addUsersToTask = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<TaskAssignment[]>>> => {
    const { taskId, userIds } = req.body;

    // ✅ Validate
    if (!taskId || !Array.isArray(userIds) || userIds.length === 0) {
      throw new ApiError(400, "Missing required fields: taskId and at least one userId");
    }

    // ✅ Get existing assignments to avoid duplicates
    const existingAssignments = await prisma.taskAssignment.findMany({
      where: {
        taskId,
        userId: { in: userIds },
      },
    });

    const existingUserIds = new Set(existingAssignments.map((a) => a.userId));

    // ✅ Filter out already assigned users
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id));

    // ✅ Create new assignments in bulk
    const newAssignments = await prisma.taskAssignment.createMany({
      data: newUserIds.map((userId) => ({
        taskId,
        userId,
      })),
      skipDuplicates: true, // just in case
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        newAssignments,
        `Assigned ${newUserIds.length} user(s) to task successfully`
      )
    );
  }
);


const updateTaskInfo = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Task>>> => {
    const {
      id,
      title,
      description,
      priority,
      status,
      tags,
      startDate,
      endDate,
      points,
      projectId,
      authorId,
      assignedUserIds,
    } = req.body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (points !== undefined) updateData.points = points;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (authorId !== undefined) updateData.authorId = authorId;

    if (Array.isArray(assignedUserIds)) {
      updateData.taskAssignments = {
        create: assignedUserIds.map((userId: string) => ({ userId })),
      };
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        taskAssignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    return res.status(200).json(new ApiResponse<Task>(200, task, "Task updated successfully"));
  }
);


export {
  getTasksAssignedByUser,
  getTasksAssignedToUser,
  createTask,
  addUsersToTask,
  updateTaskInfo,
  getTasksByProjectId
};
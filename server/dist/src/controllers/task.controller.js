"use strict";
// import { Request, Response } from "express";
// import asyncHandler from "../utils/asyncHandler";
// import { ApiError } from "../utils/ApiError";
// import { ApiResponse } from "../utils/ApiResponse";
// import { PrismaClient, Prisma } from "@prisma/client";
// import { Task } from "@prisma/client";
Object.defineProperty(exports, "__esModule", { value: true });
// const prisma = new PrismaClient(); 
// type TaskWithRelations = Prisma.TaskGetPayload<{
//   include: {
//     project: true;
//     author: true;
//     taskAssignments: true;
//     comments: true;
//     attachments: true;
//   };
// }>;
// const getUserTasks = asyncHandler(
//   async (req: Request, res: Response): Promise<Response<ApiResponse<TaskWithRelations[]>>> => {
//     const userId = req.user.id;
//     const tasks = await prisma.task.findMany({
//       where: { authorId: userId },
//       include: {
//         project: true,
//         author: true,
//         taskAssignments: true,
//         comments: true,
//         attachments: true,
//       },
//     });
//     if (!tasks || tasks.length === 0) {
//       throw new ApiError(404, "No tasks found");
//     }
//     return res
//       .status(200)
//       .json(
//         new ApiResponse<TaskWithRelations[]>(
//           200,
//           tasks,
//           "User tasks fetched successfully"
//         )
//       );
//   }
// );

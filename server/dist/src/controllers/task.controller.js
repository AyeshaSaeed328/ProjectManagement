"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserToTask = exports.createTask = exports.getUserTasks = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getUserTasks = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = "cmcuahygc0000j3v8wz0l1yy9";
    const tasks = yield prisma.task.findMany({
        where: { authorId: userId },
        include: {
            project: true,
            author: true,
            taskAssignments: true,
            comments: true,
            attachments: true,
        },
    });
    if (!tasks || tasks.length === 0) {
        throw new ApiError_1.ApiError(404, "No tasks found");
    }
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, tasks, "User tasks fetched successfully"));
}));
exports.getUserTasks = getUserTasks;
const createTask = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, priority, status, tags, startDate, endDate, points, projectId, authorId, assignedUserIds = [], } = req.body;
    if (!title || !projectId || !authorId) {
        throw new ApiError_1.ApiError(400, "Missing required fields");
    }
    const task = yield prisma.task.create({
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
                create: assignedUserIds.map((userId) => ({ userId })),
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
        throw new ApiError_1.ApiError(500, "Failed to create task");
    }
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, task, "Task created successfully"));
}));
exports.createTask = createTask;
const addUserToTask = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId, userId } = req.body;
    // ✅ Validation
    if (!taskId || !userId) {
        throw new ApiError_1.ApiError(400, "Missing required fields: taskId and userId are required");
    }
    // ✅ Check if assignment already exists
    // const existingAssignment = await prisma.taskAssignment.findUnique({
    //   where: {
    //     taskId_userId: {
    //       taskId,
    //       userId,
    //     },
    //   },
    // });
    // if (existingAssignment) {
    //   throw new ApiError(409, "User is already assigned to this task");
    // }
    // ✅ Create the assignment
    const taskAssignment = yield prisma.taskAssignment.create({
        data: {
            taskId,
            userId,
        },
    });
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, taskAssignment, "User added to task successfully"));
}));
exports.addUserToTask = addUserToTask;

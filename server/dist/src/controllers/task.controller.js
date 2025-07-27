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
exports.getTasksByProjectId = exports.updateTaskInfo = exports.addUsersToTask = exports.createTask = exports.getTasksAssignedToUser = exports.getTasksAssignedByUser = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getTasksAssignedByUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(400, "User ID is required");
    }
    const tasks = yield prisma.task.findMany({
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
        throw new ApiError_1.ApiError(404, "No tasks found");
    }
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, tasks, "User tasks fetched successfully"));
}));
exports.getTasksAssignedByUser = getTasksAssignedByUser;
const getTasksAssignedToUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(400, "User ID is required");
    }
    const tasks = yield prisma.task.findMany({
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
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, tasks, "User tasks fetched successfully"));
}));
exports.getTasksAssignedToUser = getTasksAssignedToUser;
const getTasksByProjectId = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projectId = req.params.projectId;
    if (!projectId) {
        throw new ApiError_1.ApiError(400, "Project ID is required");
    }
    const tasks = yield prisma.task.findMany({
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
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, tasks, "Tasks fetched successfully"));
}));
exports.getTasksByProjectId = getTasksByProjectId;
const createTask = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!authorId) {
        throw new ApiError_1.ApiError(400, "Author ID is required");
    }
    const { title, description, priority, status, tags, startDate, endDate, points, projectId, assignedUserIds = [], } = req.body;
    if (!title || !projectId || !priority || !status) {
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
const addUsersToTask = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId, userIds } = req.body;
    // ✅ Validate
    if (!taskId || !Array.isArray(userIds) || userIds.length === 0) {
        throw new ApiError_1.ApiError(400, "Missing required fields: taskId and at least one userId");
    }
    // ✅ Get existing assignments to avoid duplicates
    const existingAssignments = yield prisma.taskAssignment.findMany({
        where: {
            taskId,
            userId: { in: userIds },
        },
    });
    const existingUserIds = new Set(existingAssignments.map((a) => a.userId));
    // ✅ Filter out already assigned users
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id));
    // ✅ Create new assignments in bulk
    const newAssignments = yield prisma.taskAssignment.createMany({
        data: newUserIds.map((userId) => ({
            taskId,
            userId,
        })),
        skipDuplicates: true, // just in case
    });
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, newAssignments, `Assigned ${newUserIds.length} user(s) to task successfully`));
}));
exports.addUsersToTask = addUsersToTask;
const updateTaskInfo = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, title, description, priority, status, tags, startDate, endDate, points, projectId, authorId, assignedUserIds, } = req.body;
    const updateData = {};
    if (title !== undefined)
        updateData.title = title;
    if (description !== undefined)
        updateData.description = description;
    if (priority !== undefined)
        updateData.priority = priority;
    if (status !== undefined)
        updateData.status = status;
    if (tags !== undefined)
        updateData.tags = tags;
    if (startDate !== undefined)
        updateData.startDate = new Date(startDate);
    if (endDate !== undefined)
        updateData.endDate = new Date(endDate);
    if (points !== undefined)
        updateData.points = points;
    if (projectId !== undefined)
        updateData.projectId = projectId;
    if (authorId !== undefined)
        updateData.authorId = authorId;
    if (Array.isArray(assignedUserIds)) {
        updateData.taskAssignments = {
            create: assignedUserIds.map((userId) => ({ userId })),
        };
    }
    const task = yield prisma.task.update({
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
        throw new ApiError_1.ApiError(404, "Task not found");
    }
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, task, "Task updated successfully"));
}));
exports.updateTaskInfo = updateTaskInfo;

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
exports.getProjectById = exports.getUserProjects = exports.updateProject = exports.deleteProject = exports.createProject = exports.getAllProjects = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// GET all projects with relations
const getAllProjects = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projects = yield prisma.project.findMany({
        include: {
            tasks: true,
            teams: {
                include: {
                    team: true,
                },
            },
        },
    });
    if (!projects || projects.length === 0) {
        throw new ApiError_1.ApiError(404, "No projects found");
    }
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, projects, "All projects fetched"));
}));
exports.getAllProjects = getAllProjects;
const getUserProjects = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "Unauthorized");
    }
    const user = yield prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
    });
    const teamId = user === null || user === void 0 ? void 0 : user.teamId;
    let projects = [];
    if (teamId) {
        const teamProjects = yield prisma.projectTeam.findMany({
            where: { teamId },
            select: { projectId: true },
        });
        const teamProjectIds = teamProjects.map((tp) => tp.projectId);
        projects = yield prisma.project.findMany({
            where: {
                OR: [
                    { managerId: userId },
                    { id: { in: teamProjectIds } },
                ],
            },
        });
    }
    else {
        projects = yield prisma.project.findMany({
            where: { managerId: userId },
        });
    }
    if (!projects) {
        throw new ApiError_1.ApiError(404, "No projects found");
    }
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, projects, "User projects fetched"));
}));
exports.getUserProjects = getUserProjects;
// CREATE project
const createProject = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const managerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { name, description, startDate, endDate, status } = req.body;
    const newProject = yield prisma.project.create({
        data: {
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status,
            manager: {
                connect: { id: managerId },
            },
        },
    });
    if (!newProject) {
        throw new ApiError_1.ApiError(400, "Project creation failed");
    }
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, newProject, "Project created successfully"));
}));
exports.createProject = createProject;
// DELETE project
const deleteProject = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // console.log("user",req.user)
    if ((req === null || req === void 0 ? void 0 : req.user.role) !== client_2.UserRole.MANAGER) {
        throw new ApiError_1.ApiError(403, `Forbidden ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.role}`);
    }
    const { id } = req.params;
    const tasks = yield prisma.task.findMany({
        where: { projectId: id },
    });
    const taskIds = tasks.map((task) => task.id);
    yield prisma.$transaction([
        prisma.taskAssignment.deleteMany({
            where: { taskId: { in: taskIds } },
        }),
        prisma.comment.deleteMany({
            where: { taskId: { in: taskIds } },
        }),
        prisma.attachment.deleteMany({
            where: { taskId: { in: taskIds } },
        }),
        prisma.task.deleteMany({
            where: { projectId: id },
        }),
        prisma.projectTeam.deleteMany({
            where: { projectId: id },
        }),
        prisma.project.delete({
            where: { id },
        })
    ]);
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Project deleted successfully"));
}));
exports.deleteProject = deleteProject;
// UPDATE project
const updateProject = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_2.UserRole.MANAGER) {
        throw new ApiError_1.ApiError(403, "Forbidden");
    }
    const { id } = req.body;
    const { name, description, startDate, endDate, status, teamIds } = req.body;
    if (!name && !description && !startDate && !endDate && !status && !teamIds) {
        throw new ApiError_1.ApiError(400, "No fields to update");
    }
    const data = {};
    if (name !== undefined)
        data.name = name;
    if (description !== undefined)
        data.description = description;
    if (startDate !== undefined)
        data.startDate = new Date(startDate);
    if (endDate !== undefined)
        data.endDate = new Date(endDate);
    if (status !== undefined)
        data.status = status;
    const updatedProject = yield prisma.project.update({
        where: { id },
        data: data
    });
    if (teamIds && teamIds.length > 0) {
        const deleted = yield prisma.projectTeam.deleteMany({
            where: { projectId: id },
        });
        console.log("Deleted project teams:", deleted);
        const projectTeams = teamIds.map((teamId) => ({
            projectId: id,
            teamId,
        }));
        yield prisma.projectTeam.createMany({
            data: projectTeams,
        });
    }
    if (!updatedProject) {
        throw new ApiError_1.ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, updatedProject, "Project updated successfully"));
}));
exports.updateProject = updateProject;
const getProjectById = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const project = yield prisma.project.findUnique({
        where: { id },
        include: {
            manager: true,
            teams: true,
        }
    });
    if (!project) {
        throw new ApiError_1.ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, project, "Project fetched successfully"));
}));
exports.getProjectById = getProjectById;

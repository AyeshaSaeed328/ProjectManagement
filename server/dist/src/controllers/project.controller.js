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
exports.updateProject = exports.deleteProject = exports.createProject = exports.getAllProjects = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
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
// CREATE project
const createProject = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, startDate, endDate, status } = req.body;
    const newProject = yield prisma.project.create({
        data: {
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status
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
    const { id } = req.params;
    const deleted = yield prisma.project.delete({
        where: { id },
    });
    if (!deleted) {
        throw new ApiError_1.ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, deleted, "Project deleted successfully"));
}));
exports.deleteProject = deleteProject;
// UPDATE project
const updateProject = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, description, startDate, endDate, status } = req.body;
    if (!name && !description && !startDate && !endDate && !status) {
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
    if (!updatedProject) {
        throw new ApiError_1.ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, updatedProject, "Project updated successfully"));
}));
exports.updateProject = updateProject;

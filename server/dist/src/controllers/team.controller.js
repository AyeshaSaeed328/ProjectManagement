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
exports.getUserTeams = exports.updateTeam = exports.getAllTeams = exports.createTeam = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllTeams = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teams = yield prisma.team.findMany({
        include: {
            members: true,
            projectTeams: true,
            teamLead: {
                select: {
                    username: true,
                    profilePicture: true
                }
            },
        }
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, teams, "Teams retrieved successfully"));
}));
exports.getAllTeams = getAllTeams;
const getUserTeams = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const teams = yield prisma.team.findMany({
        where: {
            members: {
                some: {
                    id: userId
                }
            }
        },
        include: {
            members: true,
            projectTeams: true,
            teamLead: {
                select: {
                    username: true,
                    profilePicture: true
                }
            },
        }
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, teams, "Teams retrieved successfully"));
}));
exports.getUserTeams = getUserTeams;
const createTeam = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamName, teamLeadId } = req.body;
    const newTeam = yield prisma.team.create({
        data: {
            teamName,
            teamLead: {
                connect: { id: teamLeadId },
            },
        },
    });
    if (!newTeam) {
        throw new ApiError_1.ApiError(400, "Team creation failed");
    }
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, newTeam, "Team created successfully"));
}));
exports.createTeam = createTeam;
const updateTeam = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { teamName, teamLeadId } = req.body;
    if (!id) {
        throw new ApiError_1.ApiError(400, "Missing team ID");
    }
    const team = yield prisma.team.findUnique({ where: { id } });
    if (!team) {
        throw new ApiError_1.ApiError(404, "Team not found");
    }
    const data = {};
    if (teamName)
        data.teamName = teamName;
    if (teamLeadId) {
        data.teamLead = {
            connect: { id: teamLeadId },
        };
    }
    const updatedTeam = yield prisma.team.update({
        where: { id },
        data,
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, updatedTeam, "Team updated successfully"));
}));
exports.updateTeam = updateTeam;

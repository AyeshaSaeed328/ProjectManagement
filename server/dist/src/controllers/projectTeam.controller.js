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
exports.assignTeamsToProject = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const assignTeamsToProject = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, teamIds } = req.body;
    if (!projectId || !Array.isArray(teamIds) || teamIds.length === 0) {
        throw new ApiError_1.ApiError(400, "Missing required fields: projectId and at least one teamId");
    }
    const existingRelations = yield prisma.projectTeam.findMany({
        where: {
            projectId,
            teamId: { in: teamIds },
        },
    });
    const existingTeamIds = new Set(existingRelations.map((rel) => rel.teamId));
    const newTeamIds = teamIds.filter((id) => !existingTeamIds.has(id));
    const newRelations = yield prisma.projectTeam.createMany({
        data: newTeamIds.map((teamId) => ({
            projectId,
            teamId,
        })),
        skipDuplicates: true, // defensive
    });
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, newRelations, `Assigned ${newTeamIds.length} team(s) to project successfully`));
}));
exports.assignTeamsToProject = assignTeamsToProject;

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
exports.assignTeamToProject = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.assignTeamToProject = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, teamId } = req.body;
    if (!projectId || !teamId) {
        throw new ApiError_1.ApiError(400, "projectId and teamId are required");
    }
    const alreadyLinked = yield prisma.projectTeam.findUnique({
        where: {
            teamId_projectId: {
                teamId,
                projectId,
            },
        },
    });
    if (alreadyLinked) {
        throw new ApiError_1.ApiError(400, "Team is already assigned to this project");
    }
    const relation = yield prisma.projectTeam.create({
        data: {
            teamId,
            projectId,
        },
    });
    if (!relation) {
        throw new ApiError_1.ApiError(500, "Failed to assign team to project");
    }
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, relation, "Team assigned to project successfully"));
}));

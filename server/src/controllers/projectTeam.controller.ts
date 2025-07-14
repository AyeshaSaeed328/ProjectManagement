import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma } from "@prisma/client";
import { ProjectTeam } from "@prisma/client";
const prisma = new PrismaClient();

export const assignTeamToProject = asyncHandler(async (req: Request, res: Response): Promise<Response<ApiResponse<ProjectTeam>>> => {
  const { projectId, teamId } = req.body;

  if (!projectId || !teamId) {
    throw new ApiError(400, "projectId and teamId are required");
  }

    const alreadyLinked = await prisma.projectTeam.findUnique({
      where: {
        teamId_projectId: {
          teamId,
          projectId,
        },
      },
    });

    if (alreadyLinked) {
      throw new ApiError(400, "Team is already assigned to this project");
    }

    const relation = await prisma.projectTeam.create({
      data: {
        teamId,
        projectId,
      },
    });
    if (!relation) {
      throw new ApiError(500, "Failed to assign team to project");
    }

    return res.status(201).json(new ApiResponse<ProjectTeam>(201, relation, "Team assigned to project successfully"));

});

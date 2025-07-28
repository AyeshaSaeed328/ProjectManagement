import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma } from "@prisma/client";
import { ProjectTeam } from "@prisma/client";
const prisma = new PrismaClient();

const assignTeamsToProject = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<ProjectTeam[]>>> => {
    const { projectId, teamIds } = req.body;

    if (!projectId || !Array.isArray(teamIds) || teamIds.length === 0) {
      throw new ApiError(400, "Missing required fields: projectId and at least one teamId");
    }

    const existingRelations = await prisma.projectTeam.findMany({
      where: {
        projectId,
        teamId: { in: teamIds },
      },
    });

    const existingTeamIds = new Set(existingRelations.map((rel) => rel.teamId));

    const newTeamIds = teamIds.filter((id) => !existingTeamIds.has(id));

    const newRelations = await prisma.projectTeam.createMany({
      data: newTeamIds.map((teamId) => ({
        projectId,
        teamId,
      })),
      skipDuplicates: true, // defensive
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        newRelations,
        `Assigned ${newTeamIds.length} team(s) to project successfully`
      )
    );
  }
);



export {
  assignTeamsToProject,
}

import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma, Team } from '@prisma/client';
import { log } from "console";

const prisma = new PrismaClient();


const getAllTeams = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Team[]>>> => {
    const teams = await prisma.team.findMany({
         
    });

    return res.status(200).json(
      new ApiResponse(200, teams, "Teams retrieved successfully")
    );
  }
);

const getUserTeams = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Team[]>>> => {
    const userId = req.params.id;
    const teams = await prisma.team.findMany({
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

    return res.status(200).json(
      new ApiResponse(200, teams, "Teams retrieved successfully")
    );
  }
);

const createTeam = asyncHandler(
  async (req:Request, res: Response): Promise<Response<ApiResponse<Team>>> => {
    
  const { teamName, teamLeadId } = req.body;

  const newTeam = await prisma.team.create({
    data: {
      teamName,
     
      teamLead: {
        connect: { id: teamLeadId },
      },
    },
  });

  if (!newTeam) {
    throw new ApiError(400, "Team creation failed");
  }

  return res.status(201).json(
    new ApiResponse(201, newTeam, "Team created successfully")
  );
});

const updateTeam = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Team>>> => {
    const { id } = req.params;
    const { teamName, teamLeadId } = req.body;
    if (!id) {
      throw new ApiError(400, "Missing team ID");
    }
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      throw new ApiError(404, "Team not found");
    }
    const data: Prisma.TeamUpdateInput = {};
    if (teamName) data.teamName = teamName;
    if (teamLeadId) {
      data.teamLead = {
        connect: { id: teamLeadId },
      };
    }
    
    const updatedTeam = await prisma.team.update({
      where: { id },
      data,
    });
    return res.status(200).json(
      new ApiResponse(200, updatedTeam, "Team updated successfully")
    );
  }
);

export { createTeam, getAllTeams, updateTeam, getUserTeams };


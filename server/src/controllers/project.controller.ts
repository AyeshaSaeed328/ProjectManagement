import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma } from "@prisma/client";
import { Project } from "@prisma/client";

const prisma = new PrismaClient();

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    tasks: true;
    teams: {
      include: {
        team: true;
      };
    };
  };
}>;

// GET all projects with relations
const getAllProjects = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<ProjectWithRelations[]>>> => {
    const projects = await prisma.project.findMany({
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
      throw new ApiError(404, "No projects found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse<ProjectWithRelations[]>(
          200,
          projects,
          "All projects fetched"
        )
      );
  }
);
// CREATE project
const createProject = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Project>>> => {
    const { name, description, startDate, endDate, status } = req.body;

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status
      },
    });

    if (!newProject) {
      throw new ApiError(400, "Project creation failed");
    }

    return res.status(201).json(
      new ApiResponse(201, newProject, "Project created successfully")
    );
  }
);

// DELETE project
const deleteProject = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Project>>> => {
    const { id } = req.params;

    const deleted = await prisma.project.delete({
      where: { id },
    });

    if (!deleted) {
      throw new ApiError(404, "Project not found");
    }

    return res.status(200).json(
      new ApiResponse<Project>(200, deleted, "Project deleted successfully")
    );
  }
);

// UPDATE project
const updateProject = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Project>>> => {
    const { id } = req.params;
    const { name, description, startDate, endDate, status } = req.body;
    if (!name && !description && !startDate && !endDate && !status) {
      throw new ApiError(400, "No fields to update");
    }
    const data: Prisma.ProjectUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (status !== undefined) data.status = status;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: data
    });

    if (!updatedProject) {
      throw new ApiError(404, "Project not found");
    }

    return res.status(200).json(
      new ApiResponse(200, updatedProject, "Project updated successfully")
    );
  }
);

export {
  getAllProjects,
  createProject,
  deleteProject,
  updateProject,
};

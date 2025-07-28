import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma } from "@prisma/client";
import { Project } from "@prisma/client";
import { UserRole } from "@prisma/client";
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
const getUserProjects = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Project[]>>> => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    const teamId = user?.teamId;

    let projects: Project[] = [];

    if (teamId) {
      const teamProjects = await prisma.projectTeam.findMany({
        where: { teamId },
        select: { projectId: true },
      });

      const teamProjectIds = teamProjects.map((tp) => tp.projectId);

      projects = await prisma.project.findMany({
        where: {
          OR: [
            { managerId: userId },
            { id: { in: teamProjectIds } },
          ],
        },
      });
    } else {
      projects = await prisma.project.findMany({
        where: { managerId: userId },
      });
    }

    if (!projects) {
      throw new ApiError(404, "No projects found");
    }

    return res.status(200).json(
      new ApiResponse<Project[]>(
        200,
        projects,
        "User projects fetched"
      )
    );
  }
);


// CREATE project
const createProject = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Project>>> => {
    const managerId = req.user?.id;
    const { name, description, startDate, endDate, status } = req.body;

    const newProject = await prisma.project.create({
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
      throw new ApiError(400, "Project creation failed");
    }

    return res.status(201).json(
      new ApiResponse(201, newProject, "Project created successfully")
    );
  }
);

// DELETE project
const deleteProject = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<null>>> => {
    // console.log("user",req.user)
    if (req?.user!.role !== UserRole.MANAGER) {
      throw new ApiError(403, `Forbidden ${req.user?.role}`);
    }
    const { id } = req.params;

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
    });

    const taskIds = tasks.map((task) => task.id);

    await prisma.$transaction([

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

   

    return res.status(200).json(
      new ApiResponse<null>(200, null, "Project deleted successfully")
    );
  }
);

// UPDATE project
const updateProject = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Project>>> => {
    if (req.user?.role !== UserRole.MANAGER) {
      throw new ApiError(403, "Forbidden");
    }
    const { id } = req.body;
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
const getProjectById = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<Project>>> => {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include:{
        manager: true
      }
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    return res.status(200).json(
      new ApiResponse(200, project, "Project fetched successfully")
    );
  }
);

export {
  getAllProjects,
  createProject,
  deleteProject,
  updateProject,
  getUserProjects,
  getProjectById
};

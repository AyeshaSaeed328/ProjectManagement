import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type Project = Prisma.ProjectGetPayload<{
//   include: {
//     tasks: true;
//     projectTeams: true;
//   };
}>;

const getAllProjects = asyncHandler(
async (req: Request, res: Response): Promise<Response<ApiResponse<Project[]>>> => {
    const projects = await prisma.project.findMany();
    if (!projects || projects.length === 0){
        throw new ApiError(404, "No projects found");
    }
    return res
    .status(200)
    .json(new ApiResponse<Project[]>(200, projects, "All projects fetched"));


});

const createProject = asyncHandler(async (req: Request, res: Response) : Promise<Response<ApiResponse<Project>>> => {
    const {name, description, startDate, endDate} = req.body
    console.log(req.body)
    const newProject = await prisma.project.create({
        data:{
            name,
            description,
            startDate: new Date(startDate),  // 👈 converting string to Date
        endDate: new Date(endDate),
        }
    })
    if (!newProject) {
        throw new ApiError(400, "Project creation failed");
    }

    return res
    .status(201)
    .json(new ApiResponse<Project>(201, newProject, "Project created successfully"));
});

export { getAllProjects, createProject };
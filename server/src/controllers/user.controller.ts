import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma,User } from '@prisma/client';
// import {uploadToCloud} from "../utils/uploadToCloud"


interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const prisma = new PrismaClient();

type UserWithRelation = Prisma.UserGetPayload<{
  include: {
    authoredTasks: true;
    taskAssignments: {
      include: {
        task: true;
      };
    };
    productOwnedTeams: {
      include: {
        members: true;
        projectTeams: true;
      };
    };
    managedTeams: {
      include: {
        members: true;
        projectTeams: true;
      };
    };
  };
}>;

const getAllUsers = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<User[]>>> => {
    const users = await prisma.user.findMany({
      
    });

    return res.status(200).json(
      new ApiResponse(200, users, "Users retrieved successfully")
    );
  }
);

const createUser = asyncHandler(
  async (req: MulterRequest, res: Response): Promise<Response<ApiResponse<User>>> => {
    const { cognitoId, username, teamId } = req.body;

    if ([username, cognitoId].some(field => !field)) {
      throw new ApiError(400, "Missing required fields");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { cognitoId }]
      }
    });

    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    let profilePictureLocalPath;
    let profilePicture;

    if (req.file) {
      profilePictureLocalPath = req.file.path;
      // profilePicture = await uploadToCloud(profilePictureLocalPath);
      profilePicture = profilePictureLocalPath

      if (!profilePicture) {
        throw new ApiError(500, "Failed to upload profile picture");
      }
    }

    const userData: Prisma.UserCreateInput = {
      cognitoId,
      username,
      // profilePicture: profilePicture?.url || "https://ui-avatars.com/api/?background=random"
      profilePicture: "https://ui-avatars.com/api/?background=random"
    };

    if (teamId) {
      userData.team = {
        connect: { id: teamId }
      };
    }

    const newUser = await prisma.user.create({ data: userData });

    return res.status(201).json(
      new ApiResponse(201, newUser, "User created successfully")
    );
  }
);

const updateUserDetails = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<User>>> => {
    const { id } = req.params;
    const { username, teamId } = req.body;

    if (!id) {
      throw new ApiError(400, "Missing user ID");
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const data: Prisma.UserUpdateInput = {};

    if (username) data.username = username;

    if (teamId) {
      data.team = {
        connect: { id: teamId }
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id},
      data
    });

    return res.status(200).json(
      new ApiResponse(200, updatedUser, "User updated successfully")
    );
  }
);


export{
  createUser,
  getAllUsers,
  updateUserDetails
};

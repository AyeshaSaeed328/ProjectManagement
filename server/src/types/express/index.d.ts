
import express from "express";
import { User as PrismaUser } from "@prisma/client";

declare global {
  namespace Express {
    interface User extends Partial<PrismaUser> {
      id: string;
      email: string;
      username: string;
      profilePicture: string | null;
      isEmailVerified?: boolean;
      teamId?: string | null;
      role?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

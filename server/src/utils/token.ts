import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { User } from "@prisma/client";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY as StringValue || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY as StringValue || "30d";

export function generateAccessToken(user: User) 
{
    
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(user: { id: string }) {
  return jwt.sign(
    { id: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}




// Define the expiry duration in milliseconds (example: 20 minutes)
const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes

// Define the return type for better clarity
interface TemporaryToken {
  unHashedToken: string;
  hashedToken: string;
  tokenExpiry: Date;
}

export const generateTemporaryToken = (): TemporaryToken => {
  // Generate a random token for client use
  const unHashedToken: string = crypto.randomBytes(20).toString("hex");

  // Hash the token for storage
  const hashedToken: string = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  // Set token expiry timestamp
  const tokenExpiry = new Date(Date.now() + USER_TEMPORARY_TOKEN_EXPIRY);

  return { unHashedToken, hashedToken, tokenExpiry };
};

import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma, User, UserLoginType } from "@prisma/client";
import { uploadOnCloudinary } from "../utils/uploadToCloud";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
} from "../utils/token";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail";
import crypto from "crypto";
import jwt from "jsonwebtoken";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const prisma = new PrismaClient();

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production"

};

const generateAccessRefreshToken = async (user: User) => {
  try {
    const accessToken = await generateAccessToken(user);
    console.log("✅ accessToken", accessToken);
    const refreshToken = await generateRefreshToken(user);
    console.log("✅ refreshToken", refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

const getAllUsers = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<User[]>>> => {
    const users = await prisma.user.findMany({});

    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users retrieved successfully"));
  }
);

const createUser = asyncHandler(
  async (
    req: MulterRequest,
    res: Response
  ): Promise<Response<ApiResponse<User>>> => {
    const { email, username, teamId, password } = req.body;

    if ([username, email, password].some((field) => !field)) {
      throw new ApiError(400, "Missing required fields");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUNDS || "10")
    );

    let profilePictureLocalPath;
    let profilePicture;

    if (req.file) {
      profilePictureLocalPath = req.file.path;
      profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
      console.log(profilePicture);
      // profilePicture = profilePictureLocalPath

      if (!profilePicture) {
        throw new ApiError(500, "Failed to upload profile picture");
      }
    }

    const userData: Prisma.UserCreateInput = {
      email,
      username,
      profilePicture:
        profilePicture?.url || "https://ui-avatars.com/api/?background=random",
      passwordHash: hashedPassword,
      loginType: UserLoginType.EMAIL_PASSWORD,
    };

    if (teamId) {
      userData.team = {
        connect: { id: teamId },
      };
    }

    const newUser = await prisma.user.create({ data: userData });

    const { unHashedToken, hashedToken, tokenExpiry } =
      generateTemporaryToken();
    await prisma.user.update({
      where: { id: newUser.id },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: tokenExpiry,
      },
    });
    await sendEmail({
      email: newUser?.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
        newUser.username,
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/users/verify-email/${unHashedToken}`
      ),
    });

    const createdUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newUser, "User created successfully"));
  }
);

const loginUser = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<User>>> => {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      throw new ApiError(400, "Missing required fields");
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (!user) {
      throw new ApiError(401, "User does not exist");
    }

    if (user.loginType !== UserLoginType.EMAIL_PASSWORD) {
      throw new ApiError(
        400,
        "You have previously registered using " +
          user.loginType?.toLowerCase() +
          ". Please use the " +
          user.loginType?.toLowerCase() +
          " login option to access your account."
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessRefreshToken(
      user
    );

    const loggedInUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
      },
    });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
          },
          "User logged in successfully"
        )
      );
  }
);

const logoutUser = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<User>>> => {
    try {
      await prisma.user.update({
        where: { id: req.user?.id },
        data: { refreshToken: null },
      });
    } catch (error) {
      throw new ApiError(401, "Something went wrong");
    }
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User Logged out successfully"));
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
        connect: { id: teamId },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated successfully"));
  }
);
const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  // generate a hash from the token that we are receiving
  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // While registering the user, same time when we are sending the verification mail
  // we have saved a hashed value of the original email verification token in the db
  // We will try to find user with the hashed token generated by received token
  // If we find the user another check is if token expiry of that token is greater than current time if not that means it is expired
  const user = await prisma.user.findFirst({
    where: {
      AND: [
        { emailVerificationToken: hashedToken },
        { emailVerificationExpiry: { gt: new Date() } },
      ],
    },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      isEmailVerified: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"));
});
const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user?.id } });

  if (!user) {
    throw new ApiError(404, "User does not exists", []);
  }

  // if email is already verified throw an error
  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified!");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
    },
  });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Mail has been sent to your mail ID"));
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Get email from the client and check if user exists
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(404, "User does not exists", []);
  }

  // Generate a temporary token
  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  // save the hashed version a of the token and expiry in the DB

  await prisma.user.update({
    where: { id: user.id },
    data: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: tokenExpiry,
    },
  });

  // Send mail with the password reset link. It should be the link of the frontend url with token
  await sendEmail({
    email: user?.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
      // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
    ),
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset mail has been sent on your mail id"
      )
    );
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  // Create a hash of the incoming reset token

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // See if user with hash similar to resetToken exists
  // If yes then check if token expiry is greater than current date
  const user = await prisma.user.findFirst({
    where: {
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: {
        gt: new Date(),
      },
    },
  });

  // If either of the one is false that means the token is invalid or expired
  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    parseInt(process.env.SALT_ROUNDS || "10")
  );

  // if everything is ok and token id valid
  // reset the forgot password token and expiry

  await prisma.user.update({
    where: { id: user.id },
    data: {
      forgotPasswordToken: null,
      forgotPasswordExpiry: null,
      passwordHash: hashedPassword,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user?.id } });

  if (!user) {
    throw new ApiError(401, "USer not found");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    parseInt(process.env.SALT_ROUNDS || "10")
  );

  const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  // assign new password in plain text
  // We have a pre save method attached to user schema which automatically hashes the password whenever added/modified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
  incomingRefreshToken,
  process.env.REFRESH_TOKEN_SECRET!
) as jwt.JwtPayload;

    const user = await prisma.user.findUnique({ where: { id: decodedToken?.id } });
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

   
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessRefreshToken(user);
    await prisma.user.update({
      where: { id: user.id },
    data: { refreshToken: newRefreshToken }})  


    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    const err = error as Error;
    throw new ApiError(401, err?.message || "Invalid refresh token");
  }
});


const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current User fetched successfully"))
})

const handleSocialLogin = asyncHandler(async (req, res) => {
   console.log("🧠 req.user:", req.user); // add this line
   console.log("✅ user on callback", req.user);
console.log("✅ session", req.session);


  if (!req.user) {
    throw new ApiError(401, "User not found");
  }
  const user = await prisma.user.findUnique({where:{id: req.user!.id}})

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user
  );

 

  return res
    .status(301)
    .cookie("accessToken", accessToken, options) // set the access token in the cookie
    .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
    .redirect(
      // redirect user to the frontend with access and refresh token in case user is not using cookies
      `${process.env.CLIENT_SSO_REDIRECT_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
});


export {
  createUser,
  getAllUsers,
  updateUserDetails,
  loginUser,
  logoutUser,
  verifyEmail,
  resendEmailVerification,
  forgotPasswordRequest,
  resetForgottenPassword,
  changeCurrentPassword,
  refreshAccessToken,
  getCurrentUser,
  handleSocialLogin
};

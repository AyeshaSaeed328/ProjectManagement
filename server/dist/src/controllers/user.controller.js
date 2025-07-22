"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserRole = exports.handleSocialLogin = exports.getCurrentUser = exports.refreshAccessToken = exports.changeCurrentPassword = exports.resetForgottenPassword = exports.forgotPasswordRequest = exports.resendEmailVerification = exports.verifyEmail = exports.logoutUser = exports.loginUser = exports.updateUserDetails = exports.getAllUsers = exports.createUser = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const uploadToCloud_1 = require("../utils/uploadToCloud");
const bcrypt_1 = __importDefault(require("bcrypt"));
const token_1 = require("../utils/token");
const mail_1 = require("../utils/mail");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
};
const generateAccessRefreshToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield (0, token_1.generateAccessToken)(user);
        console.log("✅ accessToken", accessToken);
        const refreshToken = yield (0, token_1.generateRefreshToken)(user);
        console.log("✅ refreshToken", refreshToken);
        yield prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        return { accessToken, refreshToken };
    }
    catch (error) {
        throw new ApiError_1.ApiError(500, "Error generating tokens");
    }
});
const getAllUsers = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({});
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, users, "Users retrieved successfully"));
}));
exports.getAllUsers = getAllUsers;
const createUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, username, teamId, password } = req.body;
    if ([username, email, password].some((field) => !field)) {
        throw new ApiError_1.ApiError(400, "Missing required fields");
    }
    const existingUser = yield prisma.user.findFirst({
        where: {
            OR: [{ username }, { email }],
        },
    });
    if (existingUser) {
        throw new ApiError_1.ApiError(400, "User already exists");
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, parseInt(process.env.SALT_ROUNDS || "10"));
    let profilePictureLocalPath;
    let profilePicture;
    if (req.file) {
        profilePictureLocalPath = req.file.path;
        profilePicture = yield (0, uploadToCloud_1.uploadOnCloudinary)(profilePictureLocalPath);
        console.log(profilePicture);
        // profilePicture = profilePictureLocalPath
        if (!profilePicture) {
            throw new ApiError_1.ApiError(500, "Failed to upload profile picture");
        }
    }
    const userData = {
        email,
        username,
        profilePicture: (profilePicture === null || profilePicture === void 0 ? void 0 : profilePicture.url) || "https://ui-avatars.com/api/?background=random",
        passwordHash: hashedPassword,
        loginType: client_1.UserLoginType.EMAIL_PASSWORD,
        role: client_1.UserRole.USER,
    };
    if (teamId) {
        userData.team = {
            connect: { id: teamId },
        };
    }
    const newUser = yield prisma.user.create({ data: userData });
    // const { unHashedToken, hashedToken, tokenExpiry } =
    //   generateTemporaryToken();
    // await prisma.user.update({
    //   where: { id: newUser.id },
    //   data: {
    //     emailVerificationToken: hashedToken,
    //     emailVerificationExpiry: tokenExpiry,
    //   },
    // });
    // await sendEmail({
    //   email: newUser?.email,
    //   subject: "Please verify your email",
    //   mailgenContent: emailVerificationMailgenContent(
    //     newUser.username,
    //     `${req.protocol}://${req.get(
    //       "host"
    //     )}/api/v1/users/verify-email/${unHashedToken}`
    //   ),
    // });
    // console.log("Email sent")
    const createdUser = yield prisma.user.findUnique({
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
        .json(new ApiResponse_1.ApiResponse(201, createdUser, "User created successfully"));
}));
exports.createUser = createUser;
const loginUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email, username, password } = req.body;
    if ((!email && !username) || !password) {
        throw new ApiError_1.ApiError(400, "Missing required fields");
    }
    const user = yield prisma.user.findFirst({
        where: {
            OR: [{ username }, { email }],
        },
    });
    if (!user) {
        throw new ApiError_1.ApiError(404, "User does not exist");
    }
    if (user.loginType !== client_1.UserLoginType.EMAIL_PASSWORD) {
        throw new ApiError_1.ApiError(400, "You have previously registered using " +
            ((_a = user.loginType) === null || _a === void 0 ? void 0 : _a.toLowerCase()) +
            ". Please use the " +
            ((_b = user.loginType) === null || _b === void 0 ? void 0 : _b.toLowerCase()) +
            " login option to access your account.");
    }
    const isPasswordValid = yield bcrypt_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new ApiError_1.ApiError(403, "Invalid credentials");
    }
    const { accessToken, refreshToken } = yield generateAccessRefreshToken(user);
    const loggedInUser = yield prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            username: true,
            email: true,
            profilePicture: true,
            refreshToken: true,
            teamId: true,
            isEmailVerified: true,
            role: true,
        },
    });
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse_1.ApiResponse(200, {
        user: loggedInUser,
    }, "User logged in successfully"));
}));
exports.loginUser = loginUser;
const logoutUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield prisma.user.update({
            where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id },
            data: { refreshToken: null },
        });
    }
    catch (error) {
        throw new ApiError_1.ApiError(401, "Something went wrong");
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse_1.ApiResponse(200, {}, "User Logged out successfully"));
}));
exports.logoutUser = logoutUser;
const updateUserDetails = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { username, teamId } = req.body;
    if (!id) {
        throw new ApiError_1.ApiError(400, "Missing user ID");
    }
    const user = yield prisma.user.findUnique({ where: { id } });
    if (!user) {
        throw new ApiError_1.ApiError(404, "User not found");
    }
    const data = {};
    if (username)
        data.username = username;
    if (teamId) {
        data.team = {
            connect: { id: teamId },
        };
    }
    const updatedUser = yield prisma.user.update({
        where: { id },
        data,
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, updatedUser, "User updated successfully"));
}));
exports.updateUserDetails = updateUserDetails;
const verifyEmail = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { verificationToken } = req.params;
    if (!verificationToken) {
        throw new ApiError_1.ApiError(400, "Email verification token is missing");
    }
    // generate a hash from the token that we are receiving
    let hashedToken = crypto_1.default
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    // While registering the user, same time when we are sending the verification mail
    // we have saved a hashed value of the original email verification token in the db
    // We will try to find user with the hashed token generated by received token
    // If we find the user another check is if token expiry of that token is greater than current time if not that means it is expired
    const user = yield prisma.user.findFirst({
        where: {
            AND: [
                { emailVerificationToken: hashedToken },
                { emailVerificationExpiry: { gt: new Date() } },
            ],
        },
    });
    if (!user) {
        throw new ApiError_1.ApiError(489, "Token is invalid or expired");
    }
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerificationToken: null,
            emailVerificationExpiry: null,
            isEmailVerified: true,
        },
    });
    //   return res
    //     .status(200)
    //     .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"));
    // });
    return res.redirect(`${process.env.CLIENT_URL}/email-verified`);
}));
exports.verifyEmail = verifyEmail;
const resendEmailVerification = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield prisma.user.findUnique({ where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id } });
    if (!user) {
        throw new ApiError_1.ApiError(404, "User does not exists", []);
    }
    // if email is already verified throw an error
    if (user.isEmailVerified) {
        throw new ApiError_1.ApiError(409, "Email is already verified!");
    }
    const { unHashedToken, hashedToken, tokenExpiry } = (0, token_1.generateTemporaryToken)();
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: tokenExpiry,
        },
    });
    yield (0, mail_1.sendEmail)({
        email: user === null || user === void 0 ? void 0 : user.email,
        subject: "Please verify your email",
        mailgenContent: (0, mail_1.emailVerificationMailgenContent)(user.username, `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`),
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "Mail has been sent to your mail ID"));
}));
exports.resendEmailVerification = resendEmailVerification;
const forgotPasswordRequest = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    // Get email from the client and check if user exists
    if (!email) {
        throw new ApiError_1.ApiError(400, "Email is required");
    }
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new ApiError_1.ApiError(404, "User does not exists", []);
    }
    // Generate a temporary token
    const { unHashedToken, hashedToken, tokenExpiry } = (0, token_1.generateTemporaryToken)();
    // save the hashed version a of the token and expiry in the DB
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            forgotPasswordToken: hashedToken,
            forgotPasswordExpiry: tokenExpiry,
        },
    });
    // Send mail with the password reset link. It should be the link of the frontend url with token
    yield (0, mail_1.sendEmail)({
        email: user === null || user === void 0 ? void 0 : user.email,
        subject: "Password reset request",
        mailgenContent: (0, mail_1.forgotPasswordMailgenContent)(user.username, 
        // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
        // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
        `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`),
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "Password reset mail has been sent on your mail id"));
}));
exports.forgotPasswordRequest = forgotPasswordRequest;
const resetForgottenPassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { resetToken } = req.params;
    const { newPassword } = req.body;
    // Create a hash of the incoming reset token
    let hashedToken = crypto_1.default
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    // See if user with hash similar to resetToken exists
    // If yes then check if token expiry is greater than current date
    const user = yield prisma.user.findFirst({
        where: {
            forgotPasswordToken: hashedToken,
            forgotPasswordExpiry: {
                gt: new Date(),
            },
        },
    });
    // If either of the one is false that means the token is invalid or expired
    if (!user) {
        throw new ApiError_1.ApiError(489, "Token is invalid or expired");
    }
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, parseInt(process.env.SALT_ROUNDS || "10"));
    // if everything is ok and token id valid
    // reset the forgot password token and expiry
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            forgotPasswordToken: null,
            forgotPasswordExpiry: null,
            passwordHash: hashedPassword,
        },
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "Password reset successfully"));
}));
exports.resetForgottenPassword = resetForgottenPassword;
const changeCurrentPassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { oldPassword, newPassword } = req.body;
    const user = yield prisma.user.findUnique({ where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id } });
    if (!user) {
        throw new ApiError_1.ApiError(401, "USer not found");
    }
    const hashedPassword = yield bcrypt_1.default.hash(newPassword, parseInt(process.env.SALT_ROUNDS || "10"));
    const isPasswordValid = yield bcrypt_1.default.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw new ApiError_1.ApiError(400, "Invalid old password");
    }
    // assign new password in plain text
    // We have a pre save method attached to user schema which automatically hashes the password whenever added/modified
    yield prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: hashedPassword,
        },
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, {}, "Password changed successfully"));
}));
exports.changeCurrentPassword = changeCurrentPassword;
const refreshAccessToken = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError_1.ApiError(401, "Unauthorized request");
    }
    try {
        const decodedToken = jsonwebtoken_1.default.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = yield prisma.user.findUnique({ where: { id: decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.id } });
        if (!user) {
            throw new ApiError_1.ApiError(401, "Invalid refresh token");
        }
        if (incomingRefreshToken !== (user === null || user === void 0 ? void 0 : user.refreshToken)) {
            throw new ApiError_1.ApiError(401, "Refresh token is expired or used");
        }
        const { accessToken, refreshToken: newRefreshToken } = yield generateAccessRefreshToken(user);
        yield prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken }
        });
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse_1.ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
    }
    catch (error) {
        const err = error;
        throw new ApiError_1.ApiError(401, (err === null || err === void 0 ? void 0 : err.message) || "Invalid refresh token");
    }
}));
exports.refreshAccessToken = refreshAccessToken;
const getCurrentUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, req.user, "Current User fetched successfully"));
}));
exports.getCurrentUser = getCurrentUser;
const handleSocialLogin = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🧠 req.user:", req.user); // add this line
    console.log("✅ user on callback", req.user);
    console.log("✅ session", req.session);
    if (!req.user) {
        throw new ApiError_1.ApiError(401, "User not found");
    }
    const user = yield prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        throw new ApiError_1.ApiError(404, "User does not exist");
    }
    const { accessToken, refreshToken } = yield generateAccessRefreshToken(user);
    return res
        .status(301)
        .cookie("accessToken", accessToken, options) // set the access token in the cookie
        .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
        .redirect(
    // redirect user to the frontend with access and refresh token in case user is not using cookies
    `${process.env.CLIENT_SSO_REDIRECT_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`);
}));
exports.handleSocialLogin = handleSocialLogin;
const changeUserRole = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, newRole } = req.body;
    if (!userId || !newRole) {
        throw new ApiError_1.ApiError(400, "User ID and new role are required");
    }
    const user = yield prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError_1.ApiError(404, "User not found");
    }
    yield prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "User role updated successfully"));
}));
exports.changeUserRole = changeUserRole;

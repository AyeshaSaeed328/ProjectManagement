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
exports.updateUserDetails = exports.getAllUsers = exports.createUser = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const uploadToCloud_1 = require("../utils/uploadToCloud");
const prisma = new client_1.PrismaClient();
const getAllUsers = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({});
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, users, "Users retrieved successfully"));
}));
exports.getAllUsers = getAllUsers;
const createUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cognitoId, username, teamId } = req.body;
    if ([username, cognitoId].some(field => !field)) {
        throw new ApiError_1.ApiError(400, "Missing required fields");
    }
    const existingUser = yield prisma.user.findFirst({
        where: {
            OR: [{ username }, { cognitoId }]
        }
    });
    if (existingUser) {
        throw new ApiError_1.ApiError(400, "User already exists");
    }
    let profilePictureLocalPath;
    let profilePicture;
    if (req.file) {
        profilePictureLocalPath = req.file.path;
        profilePicture = yield (0, uploadToCloud_1.uploadToS3)(profilePictureLocalPath);
        // profilePicture = profilePictureLocalPath
        if (!profilePicture) {
            throw new ApiError_1.ApiError(500, "Failed to upload profile picture");
        }
    }
    const userData = {
        cognitoId,
        username,
        profilePicture: (profilePicture === null || profilePicture === void 0 ? void 0 : profilePicture.Location) || "https://ui-avatars.com/api/?background=random"
        // profilePicture: "https://ui-avatars.com/api/?background=random"
    };
    if (teamId) {
        userData.team = {
            connect: { id: teamId }
        };
    }
    const newUser = yield prisma.user.create({ data: userData });
    return res.status(201).json(new ApiResponse_1.ApiResponse(201, newUser, "User created successfully"));
}));
exports.createUser = createUser;
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
            connect: { id: teamId }
        };
    }
    const updatedUser = yield prisma.user.update({
        where: { id },
        data
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, updatedUser, "User updated successfully"));
}));
exports.updateUserDetails = updateUserDetails;

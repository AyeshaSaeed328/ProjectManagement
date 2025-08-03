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
exports.getUserChats = exports.getOrCreateOneOnOneChat = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const socket_1 = require("../socket");
const constants_1 = require("../constants");
const deleteFromCloudinary_1 = require("../utils/deleteFromCloudinary");
const prisma = new client_1.PrismaClient();
const chatCommonInclude = {
    participants: {
        select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
        },
    },
    lastMessage: {
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    },
    admin: {
        select: {
            id: true,
            username: true,
        },
    },
};
const getOrCreateOneOnOneChat = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { receiverId } = req.params;
    const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!senderId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const receiver = yield prisma.user.findUnique({
        where: { id: receiverId },
    });
    if (!receiver) {
        throw new ApiError_1.ApiError(404, "User not found");
    }
    const existingChat = yield prisma.chat.findFirst({
        where: {
            isGroupChat: false,
            participants: {
                every: {
                    OR: [{ id: senderId }, { id: receiverId }],
                },
            },
        },
        include: chatCommonInclude,
    });
    if (existingChat) {
        return res
            .status(200)
            .json(new ApiResponse_1.ApiResponse(200, existingChat, "Chat retrieved successfully"));
    }
    const newChat = yield prisma.chat.create({
        data: {
            name: "One on one chat",
            isGroupChat: false,
            participants: {
                connect: [{ id: senderId }, { id: receiver.id }],
            },
        },
    });
    const createdChat = yield prisma.chat.findUnique({
        where: { id: newChat.id },
        include: chatCommonInclude,
    });
    if (!createdChat)
        throw new ApiError_1.ApiError(500, "Internal server error");
    createdChat.participants.forEach((participant) => {
        if (participant.id === senderId)
            return;
        (0, socket_1.emitSocketEvent)(req, participant.id, constants_1.ChatEventEnum.NEW_CHAT_EVENT, createdChat);
    });
    return res
        .status(201)
        .json(new ApiResponse_1.ApiResponse(200, createdChat, "Chat created successfully"));
}));
exports.getOrCreateOneOnOneChat = getOrCreateOneOnOneChat;
const getUserChats = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const chats = yield prisma.chat.findMany({
        where: {
            participants: {
                some: { id: userId },
            },
        },
        include: chatCommonInclude,
        orderBy: {
            updatedAt: "desc",
        },
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, chats || [], "Chats retrieved successfully"));
}));
exports.getUserChats = getUserChats;
const deleteCascadeChatMessages = (chatId) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield prisma.message.findMany({
        where: {
            chatId,
        },
        include: {
            attachments: true
        }
    });
    const attachments = messages.flatMap((msg) => msg.attachments);
    for (const attachment of attachments) {
        try {
            (0, deleteFromCloudinary_1.deleteImageFromCloudinary)(attachment.url);
        }
        catch (err) {
            console.warn(`Failed to delete file: ${attachment.url}`, err);
        }
    }
    const messageIds = messages.map((msg) => msg.id);
    if (messageIds.length > 0) {
        yield prisma.attachment.deleteMany({
            where: {
                messageId: { in: messageIds },
            },
        });
        yield prisma.message.deleteMany({
            where: {
                chatId,
            }
        });
    }
});

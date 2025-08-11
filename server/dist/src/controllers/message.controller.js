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
exports.getEveryMessage = exports.deleteMessage = exports.getAllMessages = exports.sendMessage = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const client_1 = require("@prisma/client");
const socket_1 = require("../socket");
const constants_1 = require("../constants");
const deleteFromCloudinary_1 = require("../utils/deleteFromCloudinary");
const uploadToCloud_1 = require("../utils/uploadToCloud");
const cloudinary_1 = require("cloudinary");
const prisma = new client_1.PrismaClient();
const messageCommonInclude = {
    sender: {
        select: {
            id: true,
            username: true,
            email: true,
            profilePicture: true,
        },
    },
    chat: {
        include: {
            participants: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    profilePicture: true,
                },
            },
        },
    },
};
const sendMessage = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { chatId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const files = req.files;
    const attachments = files.attachments || [];
    const { content } = req.body;
    if ((!content || content.trim() === "") && attachments.length === 0) {
        throw new ApiError_1.ApiError(400, "Message content or attachment is required");
    }
    const chat = yield prisma.chat.findUnique({
        where: { id: chatId },
    });
    if (!chat) {
        throw new ApiError_1.ApiError(404, "Chat not found");
    }
    let messageFiles = [];
    if (attachments.length > 0) {
        for (const file of attachments) {
            const uploaded = yield (0, uploadToCloud_1.uploadOnCloudinary)(file.path);
            if (!uploaded || !uploaded.url) {
                for (const f of messageFiles) {
                    yield cloudinary_1.v2.uploader.destroy(f.public_id);
                }
                throw new ApiError_1.ApiError(500, `Failed to upload file: ${file.originalname}`);
            }
            messageFiles.push({
                url: uploaded.url,
                public_id: uploaded.public_id,
                fileName: file.originalname,
                fileType: file.mimetype,
                size: file.size,
            });
        }
    }
    const message = yield prisma.message.create({
        data: {
            content,
            sender: { connect: { id: userId } },
            chat: { connect: { id: chatId } },
        },
        include: messageCommonInclude,
    });
    if (messageFiles.length > 0) {
        yield prisma.attachment.createMany({
            data: messageFiles.map((file) => ({
                url: file.url,
                public_id: file.public_id,
                fileName: file.fileName,
                fileType: file.fileType,
                size: file.size,
                uploadedById: userId,
                messageId: message.id,
            })),
        });
    }
    const updatedChat = yield prisma.chat.update({
        where: { id: chatId },
        data: {
            lastMessage: {
                connect: { id: message.id },
            },
            lastMessageAt: new Date(),
        },
    });
    const fullMessage = yield prisma.message.findUnique({
        where: { id: message.id },
        include: messageCommonInclude,
    });
    if (!fullMessage) {
        throw new ApiError_1.ApiError(500, "internal server error");
    }
    fullMessage.chat.participants.forEach((participant) => {
        if (participant.id === userId)
            return;
        (0, socket_1.emitSocketEvent)(req, participant.id, constants_1.ChatEventEnum.MESSAGE_RECEIVED_EVENT, fullMessage);
    });
    return res
        .status(201)
        .json(new ApiResponse_1.ApiResponse(201, fullMessage, "Message saved successfully"));
}));
exports.sendMessage = sendMessage;
const getAllMessages = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { chatId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const selectedChat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: { participants: true },
    });
    if (!selectedChat) {
        throw new ApiError_1.ApiError(404, "Chat not found");
    }
    if (!((_b = selectedChat.participants) === null || _b === void 0 ? void 0 : _b.some((participant) => participant.id === userId))) {
        throw new ApiError_1.ApiError(400, "User is not a part of this chat");
    }
    const messages = yield prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        include: messageCommonInclude,
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, messages, "Messages retrieved successfully"));
}));
exports.getAllMessages = getAllMessages;
const deleteMessage = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { messageId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const message = yield prisma.message.findUnique({
        where: { id: messageId },
        include: { chat: { include: { participants: true } } },
    });
    if (!message) {
        throw new ApiError_1.ApiError(404, "Message not found");
    }
    if (!((_b = message.chat.participants) === null || _b === void 0 ? void 0 : _b.some((participant) => participant.id === userId))) {
        throw new ApiError_1.ApiError(400, "User is not a part of this chat");
    }
    if (message.senderId !== userId) {
        throw new ApiError_1.ApiError(403, "You can only delete your own messages");
    }
    // Delete attachments from Cloudinary
    const attachments = yield prisma.attachment.findMany({
        where: { messageId: message.id },
    });
    for (const attachment of attachments) {
        try {
            yield (0, deleteFromCloudinary_1.deleteImageFromCloudinary)(attachment.url);
            yield prisma.attachment.delete({ where: { id: attachment.id } });
        }
        catch (error) {
            console.error(`Failed to delete attachment ${attachment.id} from Cloudinary:`, error);
        }
    }
    yield prisma.message.delete({
        where: { id: messageId },
    });
    if (message.chat.lastMessageId === messageId) {
        const newLastMessage = yield prisma.message.findFirst({
            where: { chatId: message.chat.id },
            orderBy: { createdAt: "desc" },
        });
        yield prisma.chat.update({
            where: { id: message.chat.id },
            data: { lastMessageId: (newLastMessage === null || newLastMessage === void 0 ? void 0 : newLastMessage.id) || null },
        });
    }
    message.chat.participants.forEach((participant) => {
        if (participant.id.toString() === userId)
            return;
        (0, socket_1.emitSocketEvent)(req, participant.id, constants_1.ChatEventEnum.MESSAGE_DELETE_EVENT, message);
    });
    return res
        .status(201)
        .json(new ApiResponse_1.ApiResponse(201, message, "Message saved successfully"));
}));
exports.deleteMessage = deleteMessage;
const getEveryMessage = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messages = yield prisma.message.findMany({
        orderBy: { createdAt: "desc" },
        include: messageCommonInclude,
    });
    return res.status(200).json(new ApiResponse_1.ApiResponse(200, messages, "Messages retrieved successfully"));
}));
exports.getEveryMessage = getEveryMessage;

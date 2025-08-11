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
exports.deleteOneOnOneChat = exports.deleteGroupChat = exports.getGroupChatDetails = exports.removeUserFromGroupChat = exports.addUserToGroupChat = exports.leaveGroupChat = exports.renameGroupChat = exports.createGroupChat = exports.getUserChats = exports.getOrCreateOneOnOneChat = void 0;
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
            profilePicture: true,
        },
    },
    lastMessage: {
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    profilePicture: true,
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
const createGroupChat = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const { name, participantIds } = req.body;
    if (participantIds.includes(userId)) {
        throw new ApiError_1.ApiError(400, "Participants array should not contain the group creator");
    }
    const members = [...new Set([...participantIds, userId])];
    if (members.length < 3) {
        throw new ApiError_1.ApiError(400, "Seems like you have passed duplicate participants.");
    }
    const groupChat = yield prisma.chat.create({
        data: {
            name,
            isGroupChat: true,
            participants: {
                connect: [{ id: userId }, ...participantIds.map((id) => ({ id }))],
            },
            admin: {
                connect: { id: userId },
            },
        },
    });
    const createdChat = yield prisma.chat.findUnique({
        where: { id: groupChat.id },
        include: chatCommonInclude,
    });
    if (!createdChat)
        throw new ApiError_1.ApiError(500, "Internal server error");
    (_b = createdChat.participants) === null || _b === void 0 ? void 0 : _b.forEach((participant) => {
        if (participant.id === userId)
            return;
        (0, socket_1.emitSocketEvent)(req, participant.id, constants_1.ChatEventEnum.NEW_CHAT_EVENT, createdChat);
    });
    return res
        .status(201)
        .json(new ApiResponse_1.ApiResponse(200, createdChat, "Group chat created successfully"));
}));
exports.createGroupChat = createGroupChat;
const getGroupChatDetails = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = req.params.id;
    const groupChat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: chatCommonInclude,
    });
    if (!groupChat) {
        throw new ApiError_1.ApiError(404, "Group chat not found");
    }
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, groupChat, "Group chat retrieved successfully"));
}));
exports.getGroupChatDetails = getGroupChatDetails;
const renameGroupChat = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const chatId = req.params.chatId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { name } = req.body;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const groupChat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: chatCommonInclude,
    });
    console.log("Group chat:", groupChat);
    if (!groupChat) {
        throw new ApiError_1.ApiError(404, "Group chat not found");
    }
    const u = yield prisma.chat.update({
        where: { id: chatId },
        data: { name },
    });
    console.log("Updated chatttt:", u);
    const updatedChat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: chatCommonInclude,
    });
    console.log("Updated chat:", updatedChat);
    if (!updatedChat) {
        throw new ApiError_1.ApiError(404, "Group chat not found");
    }
    (_b = updatedChat === null || updatedChat === void 0 ? void 0 : updatedChat.participants) === null || _b === void 0 ? void 0 : _b.forEach((participant) => {
        (0, socket_1.emitSocketEvent)(req, participant.id, constants_1.ChatEventEnum.UPDATE_GROUP_NAME_EVENT, updatedChat);
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, updatedChat, "Group chat renamed successfully"));
}));
exports.renameGroupChat = renameGroupChat;
const leaveGroupChat = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const chatId = req.params.chatId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const groupChat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: chatCommonInclude,
    });
    if (!groupChat) {
        throw new ApiError_1.ApiError(404, "Group chat not found");
    }
    if (!groupChat.participants.some((p) => p.id === userId)) {
        throw new ApiError_1.ApiError(403, "User is not a participant of this group chat");
    }
    if (groupChat.participants.length === 1) {
    }
    if (userId === groupChat.adminId) {
        const newAdmin = groupChat.participants[0].id;
        yield prisma.chat.update({
            where: { id: chatId },
            data: {
                admin: {
                    connect: { id: newAdmin },
                },
            },
        });
    }
    const updatedChat = yield prisma.chat.update({
        where: { id: chatId },
        data: {
            participants: {
                disconnect: { id: userId },
            },
        },
        include: chatCommonInclude,
    });
    (_b = updatedChat.participants) === null || _b === void 0 ? void 0 : _b.forEach((participant) => {
        (0, socket_1.emitSocketEvent)(req, participant.id, constants_1.ChatEventEnum.LEAVE_CHAT_EVENT, updatedChat);
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, updatedChat, "User left group chat successfully"));
}));
exports.leaveGroupChat = leaveGroupChat;
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
    console.log("Fetched user chats:", chats);
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, chats || [], "Chats retrieved successfully"));
}));
exports.getUserChats = getUserChats;
const addUserToGroupChat = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { chatId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    let { participantIds } = req.body;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const groupChat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: chatCommonInclude,
    });
    if (!groupChat) {
        throw new ApiError_1.ApiError(404, "Group chat not found");
    }
    if (!groupChat.participants.some((p) => p.id === userId)) {
        throw new ApiError_1.ApiError(403, "User is not a participant of this group chat");
    }
    // Normalize participantIds to an array
    if (!participantIds) {
        throw new ApiError_1.ApiError(400, "Participant ID(s) are required");
    }
    if (!Array.isArray(participantIds)) {
        participantIds = [participantIds];
    }
    // Remove IDs that are already participants
    const existingIds = groupChat.participants.map(p => p.id);
    const newIds = participantIds.filter((id) => !existingIds.includes(id));
    if (newIds.length === 0) {
        throw new ApiError_1.ApiError(400, "All provided users are already in the group chat");
    }
    const updatedChat = yield prisma.chat.update({
        where: { id: chatId },
        data: {
            participants: {
                connect: newIds.map((id) => ({ id })),
            },
        },
        include: chatCommonInclude,
    });
    // Emit single event for all changes
    (0, socket_1.emitSocketEvent)(req, updatedChat.id, constants_1.ChatEventEnum.NEW_CHAT_EVENT, updatedChat);
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, updatedChat, `User(s) added to group chat successfully`));
}));
exports.addUserToGroupChat = addUserToGroupChat;
const removeUserFromGroupChat = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { chatId, participantId: userToRemoveId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const groupChat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: chatCommonInclude,
    });
    if (!groupChat) {
        throw new ApiError_1.ApiError(404, "Group chat not found");
    }
    if (!groupChat.participants.some((p) => p.id === userId)) {
        throw new ApiError_1.ApiError(403, "User is not a participant of this group chat");
    }
    if (!userToRemoveId) {
        throw new ApiError_1.ApiError(400, "User ID to remove is required");
    }
    const updatedChat = yield prisma.chat.update({
        where: { id: chatId },
        data: {
            participants: {
                disconnect: { id: userToRemoveId },
            },
        },
        include: chatCommonInclude,
    });
    (0, socket_1.emitSocketEvent)(req, updatedChat.id, constants_1.ChatEventEnum.LEAVE_CHAT_EVENT, updatedChat);
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, updatedChat, "User removed from group chat successfully"));
}));
exports.removeUserFromGroupChat = removeUserFromGroupChat;
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
const deleteGroupChat = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chatId = req.params.id;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const groupChat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: chatCommonInclude,
    });
    if (!groupChat) {
        throw new ApiError_1.ApiError(404, "Group chat not found");
    }
    if (userId !== groupChat.adminId) {
        throw new ApiError_1.ApiError(403, "User is not the admin of this group chat");
    }
    yield deleteCascadeChatMessages(chatId);
    const deletedChat = yield prisma.chat.delete({
        where: { id: chatId },
    });
    const otherParticipants = groupChat.participants.filter((p) => p.id !== userId);
    otherParticipants.forEach((participant) => {
        (0, socket_1.emitSocketEvent)(req, participant.id, constants_1.ChatEventEnum.LEAVE_CHAT_EVENT, deletedChat);
    });
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, groupChat, "Group chat deleted successfully"));
}));
exports.deleteGroupChat = deleteGroupChat;
const deleteOneOnOneChat = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chatId = req.params.id;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        throw new ApiError_1.ApiError(401, "User not authenticated");
    }
    const chat = yield prisma.chat.findUnique({
        where: { id: chatId },
        include: chatCommonInclude,
    });
    if (!chat) {
        throw new ApiError_1.ApiError(404, "Chat not found");
    }
    if (!chat.participants.some((p) => p.id === userId)) {
        throw new ApiError_1.ApiError(403, "User is not a participant of this chat");
    }
    yield deleteCascadeChatMessages(chatId);
    const deletedChat = yield prisma.chat.delete({
        where: { id: chatId },
    });
    const otherParticipant = chat.participants.find((p) => p.id !== userId);
    if (otherParticipant) {
        (0, socket_1.emitSocketEvent)(req, otherParticipant.id, constants_1.ChatEventEnum.LEAVE_CHAT_EVENT, deletedChat);
    }
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, chat, "One-on-one chat deleted successfully"));
}));
exports.deleteOneOnOneChat = deleteOneOnOneChat;

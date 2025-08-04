import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma } from "@prisma/client";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";
import { deleteImageFromCloudinary } from "../utils/deleteFromCloudinary";

const prisma = new PrismaClient();

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
type ChatWithDetails = Prisma.ChatGetPayload<{
  include: typeof chatCommonInclude;
}>;

const getOrCreateOneOnOneChat = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const { receiverId } = req.params;
    const senderId = req.user?.id;
    if (!senderId) {
      throw new ApiError(401, "User not authenticated");
    }
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new ApiError(404, "User not found");
    }

    const existingChat = await prisma.chat.findFirst({
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
        .json(
          new ApiResponse(200, existingChat, "Chat retrieved successfully")
        );
    }
    const newChat = await prisma.chat.create({
      data: {
        name: "One on one chat",
        isGroupChat: false,
        participants: {
          connect: [{ id: senderId }, { id: receiver.id }],
        },
      },
    });

    const createdChat = await prisma.chat.findUnique({
      where: { id: newChat.id },
      include: chatCommonInclude,
    });

    if (!createdChat) throw new ApiError(500, "Internal server error");

    createdChat.participants.forEach((participant) => {
      if (participant.id === senderId) return;

      emitSocketEvent(
        req,
        participant.id,
        ChatEventEnum.NEW_CHAT_EVENT,
        createdChat
      );
    });

    return res
      .status(201)
      .json(
        new ApiResponse<ChatWithDetails>(
          200,
          createdChat,
          "Chat created successfully"
        )
      );
  }
);

const createGroupChat = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const { name, participantIds } = req.body;

    if (participantIds.includes(userId)) {
    throw new ApiError(
      400,
      "Participants array should not contain the group creator"
    );
  }

  const members = [...new Set([...participantIds, userId])];

  if (members.length < 3) {
    throw new ApiError(
      400,
      "Seems like you have passed duplicate participants."
    );
  }
  const groupChat = await prisma.chat.create({
    data: {
      name,
      isGroupChat: true,
      participants: {
        connect: [{ id: userId }, ...participantIds.map((id:string) => ({ id }))],
      },
      admin: {
        connect: { id: userId },
      },
    },
  });

  const createdChat = await prisma.chat.findUnique({
    where: { id: groupChat.id },
    include: chatCommonInclude,
  });

  if (!createdChat) throw new ApiError(500, "Internal server error");

  createdChat.participants?.forEach((participant) => {
    if (participant.id === userId) return;

    emitSocketEvent(
      req,
      participant.id,
      ChatEventEnum.NEW_CHAT_EVENT,
      createdChat
    );
  });

  return res
    .status(201)
    .json(
      new ApiResponse<ChatWithDetails>(
        200,
        createdChat,
        "Group chat created successfully"
      )
    );
  }
);
const getGroupChatDetails = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const chatId = req.params.id;
    const groupChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: chatCommonInclude,
    });

    if (!groupChat) {
      throw new ApiError(404, "Group chat not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse<ChatWithDetails>(
          200,
          groupChat,
          "Group chat retrieved successfully"
        )
      );
  }
);

const renameGroupChat = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const chatId = req.params.id;
    const userId = req.user?.id;
    const { name } = req.body;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const groupChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: chatCommonInclude,
    });

    if (!groupChat) {
      throw new ApiError(404, "Group chat not found");
    }


    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { name },
      include: chatCommonInclude,
    });

    updatedChat.participants?.forEach((participant) => {
      emitSocketEvent(
        req,
        participant.id,
        ChatEventEnum.UPDATE_GROUP_NAME_EVENT,
        updatedChat
      );
    });

    return res
      .status(200)
      .json(
        new ApiResponse<ChatWithDetails>(
          200,
          updatedChat,
          "Group chat renamed successfully"
        )
      );
  }
);

const leaveGroupChat = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const chatId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const groupChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: chatCommonInclude,
    });

    if (!groupChat) {
      throw new ApiError(404, "Group chat not found");
    }

    if (!groupChat.participants.some((p) => p.id === userId)) {
      throw new ApiError(403, "User is not a participant of this group chat");
    }

    if (groupChat.participants.length === 1) {
      
    }

    if (userId === groupChat.adminId) {
      const newAdmin = groupChat.participants[0].id;
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          admin: {
            connect: { id: newAdmin },
          },
        },
      });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        participants: {
          disconnect: { id: userId },
        },
      },
      include: chatCommonInclude,
    });

    updatedChat.participants?.forEach((participant) => {
      emitSocketEvent(
        req,
        participant.id,
        ChatEventEnum.LEAVE_CHAT_EVENT,
        updatedChat
      );
    });

    return res
      .status(200)
      .json(
        new ApiResponse<ChatWithDetails>(
          200,
          updatedChat,
          "User left group chat successfully"
        )
      );
  }
);


const getUserChats = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<ChatWithDetails[]>>> => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const chats = await prisma.chat.findMany({
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
      .json(
        new ApiResponse<ChatWithDetails[]>(
          200,
          chats || [],
          "Chats retrieved successfully"
        )
      );
  }
);

const addUserToGroupChat = asyncHandler(
   async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const {chatId, participantId:newUserId} = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const groupChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: chatCommonInclude,
    });

    if (!groupChat) {
      throw new ApiError(404, "Group chat not found");
    }

    if (!groupChat.participants.some((p) => p.id === userId)) {
      throw new ApiError(403, "User is not a participant of this group chat");
    }

    if (!newUserId) {
      throw new ApiError(400, "New user ID is required");
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        participants: {
          connect: { id: newUserId },
        },
      },
      include: chatCommonInclude,
    });

    emitSocketEvent(
      req,
      updatedChat.id,
      ChatEventEnum.NEW_CHAT_EVENT,
      updatedChat
    );

    return res
      .status(200)
      .json(
        new ApiResponse<ChatWithDetails>(
          200,
          updatedChat,
          "User added to group chat successfully"
        )
      );
  }
);

const removeUserFromGroupChat = asyncHandler(
   async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const { chatId, participantId: userToRemoveId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const groupChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: chatCommonInclude,
    });

    if (!groupChat) {
      throw new ApiError(404, "Group chat not found");
    }

    if (!groupChat.participants.some((p) => p.id === userId)) {
      throw new ApiError(403, "User is not a participant of this group chat");
    }

    if (!userToRemoveId) {
      throw new ApiError(400, "User ID to remove is required");
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        participants: {
          disconnect: { id: userToRemoveId },
        },
      },
      include: chatCommonInclude,
    });

    emitSocketEvent(
      req,
      updatedChat.id,
      ChatEventEnum.LEAVE_CHAT_EVENT,
      updatedChat
    );

    return res
      .status(200)
      .json(
        new ApiResponse<ChatWithDetails>(
          200,
          updatedChat,
          "User removed from group chat successfully"
        )
      );
  }
);

const deleteCascadeChatMessages = async (chatId: string): Promise<void> => {
  const messages = await prisma.message.findMany({
    where: {
      chatId,
    },
    include:{
      attachments: true
    }
  });

  const attachments = messages.flatMap((msg) => msg.attachments)

  for (const attachment of attachments) {
    try {
      deleteImageFromCloudinary(attachment.url)
    } catch (err) {
      console.warn(`Failed to delete file: ${attachment.url}`, err);
    }
  }
  const messageIds = messages.map((msg) => msg.id);
  if (messageIds.length > 0) {
    await prisma.attachment.deleteMany({
      where: {
        messageId: { in: messageIds },
      },
    });
  await prisma.message.deleteMany({
    where:{
      chatId,
    }
  })


}};


const deleteGroupChat = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const chatId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const groupChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: chatCommonInclude,
    });

    if (!groupChat) {
      throw new ApiError(404, "Group chat not found");
    }

    if (userId !== groupChat.adminId) {
      throw new ApiError(403, "User is not the admin of this group chat");
    }

    await deleteCascadeChatMessages(chatId);

    const deletedChat = await prisma.chat.delete({
      where: { id: chatId },
    });

    const otherParticipants = groupChat.participants.filter((p) => p.id !== userId);
    otherParticipants.forEach((participant) => {
      emitSocketEvent(
        req,
        participant.id,
        ChatEventEnum.LEAVE_CHAT_EVENT,
        deletedChat
      );
    });

    return res
      .status(200)
      .json(
        new ApiResponse<ChatWithDetails>(
          200,
          groupChat,
          "Group chat deleted successfully"
        )
      );
  }
);

const deleteOneOnOneChat = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<ChatWithDetails>>> => {
    const chatId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: chatCommonInclude,
    });

    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }

    if (!chat.participants.some((p) => p.id === userId)) {
      throw new ApiError(403, "User is not a participant of this chat");
    }

    await deleteCascadeChatMessages(chatId);

    const deletedChat = await prisma.chat.delete({
      where: { id: chatId },
    });

    const otherParticipant = chat.participants.find((p) => p.id !== userId);
    if (otherParticipant) {
      emitSocketEvent(
        req,
        otherParticipant.id,
        ChatEventEnum.LEAVE_CHAT_EVENT,
        deletedChat
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse<ChatWithDetails>(
          200,
          chat,
          "One-on-one chat deleted successfully"
        )
      );
  }
);

export { getOrCreateOneOnOneChat,
         getUserChats,
         createGroupChat,
         renameGroupChat,
         leaveGroupChat,
         addUserToGroupChat,
         removeUserFromGroupChat,
         getGroupChatDetails,
         deleteGroupChat,
         deleteOneOnOneChat
       };

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

export { getOrCreateOneOnOneChat, getUserChats };

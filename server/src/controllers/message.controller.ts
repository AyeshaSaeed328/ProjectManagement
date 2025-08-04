import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PrismaClient, Prisma } from "@prisma/client";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";
import { deleteImageFromCloudinary } from "../utils/deleteFromCloudinary";
import { uploadOnCloudinary } from "../utils/uploadToCloud";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

const messageCommonInclude = {
  sender: {
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
    },
  },
  chat: {
    include: {
      participants: {
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },
      },
    },
  },
};
type MessageWithDetails = Prisma.MessageGetPayload<{
  include: typeof messageCommonInclude;
}>;

const sendMessage = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<Response<ApiResponse<MessageWithDetails>>> => {
    const { chatId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const attachments = files.attachments || [];
    const { content } = req.body;
    if ((!content || content.trim() === "") && attachments.length === 0) {
      throw new ApiError(400, "Message content or attachment is required");
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }
    let messageFiles: {
      url: string;
      public_id: string;
      fileName: string;
      fileType: string;
      size: number;
    }[] = [];
    

    if (attachments.length > 0) {
      for (const file of attachments) {
        const uploaded = await uploadOnCloudinary(file.path);

        if (!uploaded || !uploaded.url) {
          for (const f of messageFiles) {
            await cloudinary.uploader.destroy(f.public_id);
          }
          throw new ApiError(
            500,
            `Failed to upload file: ${file.originalname}`
          );
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

    const message = await prisma.message.create({
      data: {
        content,
        sender: { connect: { id: userId } },
        chat: { connect: { id: chatId } },
      },
      include: messageCommonInclude,
    });

    if (messageFiles.length > 0) {
      await prisma.attachment.createMany({
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
    const updatedChat = await prisma.chat.update({
  where: { id: chatId },
  data: {
    lastMessage: {
      connect: { id: message.id },
    },
  },
});

const fullMessage = await prisma.message.findUnique({
  where: { id: message.id },
  include: messageCommonInclude,
});

if (!fullMessage) {
  throw new ApiError(500, "internal server error");
}

fullMessage.chat.participants.forEach((participant) => {
    if (participant.id === userId) return;
    emitSocketEvent(
      req,
      participant.id,
      ChatEventEnum.MESSAGE_RECEIVED_EVENT,
      fullMessage
    );
  });
  return res
    .status(201)
    .json(new ApiResponse(201, fullMessage, "Message saved successfully"));



  }
);

const getAllMessages = asyncHandler(
  async (req: Request, res: Response): Promise<Response<ApiResponse<MessageWithDetails[]>>> => {
    const { chatId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }
    const selectedChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });
    if (!selectedChat) {
      throw new ApiError(404, "Chat not found");
    }
   if (!selectedChat.participants?.some((participant) => participant.id === userId)) {
  throw new ApiError(400, "User is not a part of this chat");
}

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      include: messageCommonInclude,
    });

    return res.status(200).json(new ApiResponse(200, messages, "Messages retrieved successfully"));
  }
);

const deleteMessage = asyncHandler(
    async (req: Request, res: Response): Promise<Response<ApiResponse<null>>> => {
        const { messageId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            throw new ApiError(401, "User not authenticated");
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { chat: { include: { participants: true } } },
        });

        if (!message) {
            throw new ApiError(404, "Message not found");
        }

        if (!message.chat.participants?.some((participant) => participant.id === userId)) {
            throw new ApiError(400, "User is not a part of this chat");
        }

        if (message.senderId !== userId) {
            throw new ApiError(403, "You can only delete your own messages");
        }
        // Delete attachments from Cloudinary
        const attachments = await prisma.attachment.findMany({
            where: { messageId: message.id },
        });
        for (const attachment of attachments) {
          try {
            await deleteImageFromCloudinary(attachment.url);
            await prisma.attachment.delete({ where: { id: attachment.id } });
          } catch (error) {
            console.error(`Failed to delete attachment ${attachment.id} from Cloudinary:`, error);
          }
        }
        await prisma.message.delete({
            where: { id: messageId },
        });
        if (message.chat.lastMessageId === messageId) {
            const newLastMessage = await prisma.message.findFirst({
                where: { chatId: message.chat.id },
                orderBy: { createdAt: "desc" },
            });
            await prisma.chat.update({
                where: { id: message.chat.id },
                data: { lastMessageId: newLastMessage?.id || null },
            });
        }
        message.chat.participants.forEach((participant) => {
            if (participant.id.toString() === userId) return;

            emitSocketEvent(
                req,
                participant.id,
                ChatEventEnum.MESSAGE_RECEIVED_EVENT,
                message
            );
        });
        return res
            .status(201)
            .json(new ApiResponse(201, message, "Message saved successfully"));

    }
);

export { 
    sendMessage,
    getAllMessages,
    deleteMessage
};

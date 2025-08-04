import cookie from "cookie";
import { Server, Socket } from "socket.io";
import { AvailableChatEvents, ChatEventEnum } from "../constants";
import { ApiError } from "../utils/ApiError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
// import cookie from "cookie";

const prisma = new PrismaClient();


const mountJoinChatEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
    console.log(`User joined the chat 🤝. chatId: `, chatId);
    // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
    // E.g. When user types we don't want to emit that event to specific participant.
    // We want to just emit that to the chat where the typing is happening
    socket.join(chatId);
  });
};

/**
 * @description This function is responsible to emit the typing event to the other participants of the chat
 * @param {Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>} socket
 */
const mountParticipantTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};


const mountParticipantStoppedTypingEvent = (socket: Socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};


const initializeSocketIO = (io: Server) => {
  io.on("connection", async (socket: Socket) => {

    try {
      const rawCookieHeader = socket.handshake.headers?.cookie;
      console.log("Raw cookie header:", rawCookieHeader);

      // const cookies = cookie.parse(rawCookieHeader || "");
      // console.log("🧪 Parsed cookies:", cookies);

      // let token = cookies?.accessToken;
      const raw = socket.handshake.headers?.cookie || "";
      const match = raw.match(/(?:^|;\s*)accessToken=([^;]+)/);
      let token = match?.[1];

      console.log("Parsed token:", token);

      if (!token) {
        token = socket.handshake.auth?.token;
      }

      if (!token) {
        throw new ApiError(401, "Un-authorized handshake. Token is missing");
      }

      console.log("✅ Token found:", token);

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decodedToken?.id },
        select: {
          id: true,
          email: true,
          username: true,
          profilePicture: true,
          teamId: true,
          isEmailVerified: true,
          role: true,
        },
      });

      if (!user) {
        throw new ApiError(401, "Un-authorized handshake. Token is invalid");
      }

      socket.user = user; // attach user to socket instance

      console.log("✅ User authenticated:", user);

      socket.join(user.id);
      console.log("📥 User joined room. userId:", user.id);

      socket.emit(ChatEventEnum.CONNECTED_EVENT);

      // Mount core event handlers here
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log("🚫 User disconnected. userId:", socket.user?.id);
        if (socket.user?.id) {
          socket.leave(socket.user.id);
        }
      });
    } catch (error) {
      console.error("❌ Socket authentication error:", error);
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        error instanceof Error
          ? error.message
          : "Something went wrong while connecting to the socket."
      );
    }
  });
};


type ChatEventType = (typeof AvailableChatEvents)[number];

const emitSocketEvent = (
  req: Request,
  roomId: string,
  event: ChatEventType,
  payload: any
) => {
  req.app.get("io").in(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };

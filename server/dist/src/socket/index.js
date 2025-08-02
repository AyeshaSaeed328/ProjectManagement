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
exports.emitSocketEvent = exports.initializeSocketIO = void 0;
const constants_1 = require("../constants");
const ApiError_1 = require("../utils/ApiError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
// import cookie from "cookie";
const prisma = new client_1.PrismaClient();
const mountJoinChatEvent = (socket) => {
    socket.on(constants_1.ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
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
const mountParticipantTypingEvent = (socket) => {
    socket.on(constants_1.ChatEventEnum.TYPING_EVENT, (chatId) => {
        socket.in(chatId).emit(constants_1.ChatEventEnum.TYPING_EVENT, chatId);
    });
};
const mountParticipantStoppedTypingEvent = (socket) => {
    socket.on(constants_1.ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
        socket.in(chatId).emit(constants_1.ChatEventEnum.STOP_TYPING_EVENT, chatId);
    });
};
const initializeSocketIO = (io) => {
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const rawCookieHeader = (_a = socket.handshake.headers) === null || _a === void 0 ? void 0 : _a.cookie;
            console.log("Raw cookie header:", rawCookieHeader);
            // const cookies = cookie.parse(rawCookieHeader || "");
            // console.log("🧪 Parsed cookies:", cookies);
            // let token = cookies?.accessToken;
            const raw = ((_b = socket.handshake.headers) === null || _b === void 0 ? void 0 : _b.cookie) || "";
            const match = raw.match(/(?:^|;\s*)accessToken=([^;]+)/);
            let token = match === null || match === void 0 ? void 0 : match[1];
            console.log("Parsed token:", token);
            if (!token) {
                token = (_c = socket.handshake.auth) === null || _c === void 0 ? void 0 : _c.token;
            }
            if (!token) {
                throw new ApiError_1.ApiError(401, "Un-authorized handshake. Token is missing");
            }
            console.log("✅ Token found:", token);
            const decodedToken = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = yield prisma.user.findUnique({
                where: { id: decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.id },
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
                throw new ApiError_1.ApiError(401, "Un-authorized handshake. Token is invalid");
            }
            socket.user = user; // attach user to socket instance
            console.log("✅ User authenticated:", user);
            socket.join(user.id);
            console.log("📥 User joined room. userId:", user.id);
            socket.emit(constants_1.ChatEventEnum.CONNECTED_EVENT);
            // Mount core event handlers here
            // mountJoinChatEvent(socket);
            // mountParticipantTypingEvent(socket);
            // mountParticipantStoppedTypingEvent(socket);
            socket.on(constants_1.ChatEventEnum.DISCONNECT_EVENT, () => {
                var _a, _b;
                console.log("🚫 User disconnected. userId:", (_a = socket.user) === null || _a === void 0 ? void 0 : _a.id);
                if ((_b = socket.user) === null || _b === void 0 ? void 0 : _b.id) {
                    socket.leave(socket.user.id);
                }
            });
        }
        catch (error) {
            console.error("❌ Socket authentication error:", error);
            socket.emit(constants_1.ChatEventEnum.SOCKET_ERROR_EVENT, error instanceof Error
                ? error.message
                : "Something went wrong while connecting to the socket.");
        }
    }));
};
exports.initializeSocketIO = initializeSocketIO;
const emitSocketEvent = (req, roomId, event, payload) => {
    req.app.get("io").in(roomId).emit(event, payload);
};
exports.emitSocketEvent = emitSocketEvent;

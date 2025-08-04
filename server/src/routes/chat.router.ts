import { Router } from "express";
import {
    getOrCreateOneOnOneChat,
         getUserChats,
         createGroupChat,
         renameGroupChat,
         leaveGroupChat,
         addUserToGroupChat,
         removeUserFromGroupChat,
         getGroupChatDetails,
         deleteGroupChat,
         deleteOneOnOneChat
} from "../controllers/chat.controller";
import { verifyJWT } from "../middlewares/auth.middleware";


const router = Router();
router.use(verifyJWT);

router.post("/c/:receiverId", getOrCreateOneOnOneChat);
router.get("/", getUserChats);
router.post("/group", createGroupChat);
router.patch("/rename/group/:chatId", renameGroupChat);
router.delete("/leave/group/:chatId", leaveGroupChat);
router.post("/add/group/:chatId/:participantId", addUserToGroupChat);
router.delete("/remove/group/:chatId/:participantId", removeUserFromGroupChat);
router.get("/group/:chatId", getGroupChatDetails);
router.delete("/group/:chatId", deleteGroupChat);
router.delete("/one-on-one/:id", deleteOneOnOneChat);

export default router;
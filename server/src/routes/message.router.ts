import { Router } from "express";
import {
    sendMessage,
    getAllMessages,
    deleteMessage
} from "../controllers/message.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";


const router = Router();
router.use(verifyJWT);

router.post("/:chatId",  upload.fields([{ name: "attachments", maxCount: 5 }]), sendMessage);
router.get("/:chatId", getAllMessages);
router.delete("/:messageId", deleteMessage);

export default router;

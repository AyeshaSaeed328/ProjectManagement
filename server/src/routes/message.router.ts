import { Router } from "express";
import {
    sendMessage,
    getAllMessages,
    deleteMessage,
    getEveryMessage
} from "../controllers/message.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";


const router = Router();
router.use(verifyJWT);

router.post("/:chatId",  upload.fields([{ name: "attachments", maxCount: 5 }]), sendMessage);
router.get("/:chatId", getAllMessages);
router.delete("/:messageId", deleteMessage);
router.get("/", getEveryMessage); // This route retrieves all messages

export default router;

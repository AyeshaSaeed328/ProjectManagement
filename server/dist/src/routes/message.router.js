"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.post("/:chatId", multer_middleware_1.upload.fields([{ name: "attachments", maxCount: 5 }]), message_controller_1.sendMessage);
router.get("/:chatId", message_controller_1.getAllMessages);
router.delete("/:messageId", message_controller_1.deleteMessage);
router.get("/", message_controller_1.getEveryMessage); // This route retrieves all messages
exports.default = router;

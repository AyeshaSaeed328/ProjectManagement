"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const passport_1 = __importDefault(require("passport"));
require("../passport/index");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/register", multer_middleware_1.upload.single("profilePicture"), user_controller_1.createUser);
router.post("/login", user_controller_1.loginUser);
router.post("/refresh-token", user_controller_1.refreshAccessToken);
router.get("/verify-email/:verificationToken", user_controller_1.verifyEmail);
router.post("/forgot-password", user_controller_1.forgotPasswordRequest);
router.post("/reset-password/:resetToken", user_controller_1.resetForgottenPassword);
//Secured Routes
router.post("/logout", auth_middleware_1.verifyJWT, user_controller_1.logoutUser);
router.get("/current-user", auth_middleware_1.verifyJWT, user_controller_1.getCurrentUser);
router.post("/change-password", auth_middleware_1.verifyJWT, user_controller_1.changeCurrentPassword);
router.post("/resend-email-verification", auth_middleware_1.verifyJWT, user_controller_1.resendEmailVerification);
router.get("/all", user_controller_1.getAllUsers);
router.patch("/update/:id", user_controller_1.updateUserDetails);
// SSO routes
router.get("/google", passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
}), (req, res) => {
    res.send("redirecting to google...");
});
router.get("/google/callback", passport_1.default.authenticate("google"), user_controller_1.handleSocialLogin);
exports.default = router;

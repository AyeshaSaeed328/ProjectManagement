import { Router } from "express";
import {createUser, getAllUsers, updateUserDetails,changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  handleSocialLogin,
  loginUser,
  logoutUser,
  refreshAccessToken,
  resendEmailVerification,
  resetForgottenPassword,
  verifyEmail,
  changeUserRole
} from "../controllers/user.controller"
import { upload } from "../middlewares/multer.middleware";
import passport from "passport";
import "../passport/index";
import { verifyJWT } from "../middlewares/auth.middleware";


const router = Router();

router.post("/register", upload.single("profilePicture"), createUser);
router.post("/login", loginUser)
router.post("/refresh-token", refreshAccessToken)
router.get("/verify-email/:verificationToken", verifyEmail)
router.post("/forgot-password", forgotPasswordRequest)
router.post("/reset-password/:resetToken", resetForgottenPassword)
router.post("/change-role", changeUserRole);


//Secured Routes
router.post("/logout", verifyJWT, logoutUser)
router.get("/current-user", verifyJWT, getCurrentUser)
router.post("/change-password", verifyJWT, changeCurrentPassword)
router.post("/resend-email-verification", verifyJWT, resendEmailVerification)
router.get("/all", getAllUsers);
router.patch("/update/:id", updateUserDetails);


// SSO routes
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
  (req, res) => {
    res.send("redirecting to google...");
  })

  router.get("/google/callback", passport.authenticate("google"), handleSocialLogin)



export default router;


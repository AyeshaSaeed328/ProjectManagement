import { Router } from "express";
import {createUser, getAllUsers, updateUserDetails} from "../controllers/user.controller"
import { upload } from "../middlewares/multer.middleware";


const router = Router();

router.post("/register", upload.single("profilePicture"), createUser);
router.get("/all", getAllUsers);
router.patch("/update/:id", updateUserDetails);

export default router;

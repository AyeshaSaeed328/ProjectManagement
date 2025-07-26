import {Router} from "express"
import {getTasksAssignedByUser, getTasksAssignedToUser, createTask, addUserToTask, updateTaskInfo, getTasksByProjectId} from "../controllers/task.controller"
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.get("/assigned-by-me", verifyJWT, getTasksAssignedByUser);
router.get("/assigned-to-me", verifyJWT, getTasksAssignedToUser);
router.post("/create", verifyJWT, createTask);
router.post("/add-user", verifyJWT, addUserToTask);
router.patch("/update",verifyJWT, updateTaskInfo);
router.get("/:projectId", verifyJWT, getTasksByProjectId);




export default router;

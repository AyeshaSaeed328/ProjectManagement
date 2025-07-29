import {Router} from "express"
import {getTasksAssignedByUser, 
    getTasksAssignedToUser, 
    createTask, 
    addUsersToTask, 
    updateTaskInfo, 
    getTasksByProjectId, 
    getTaskById,
    deleteTask

} from "../controllers/task.controller"
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.get("/assigned-by-me", verifyJWT, getTasksAssignedByUser);
router.get("/assigned-to-me", verifyJWT, getTasksAssignedToUser);
router.post("/create", verifyJWT, createTask);
router.post("/add-users", verifyJWT, addUsersToTask);
router.patch("/update",verifyJWT, updateTaskInfo);
router.get("/:projectId", verifyJWT, getTasksByProjectId);
router.get("/:id", verifyJWT, getTaskById);
router.delete("/:id", verifyJWT, deleteTask);

export default router;

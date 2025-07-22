import {Router} from "express"
import {getTasksAssignedByUser, getTasksAssignedToUser, createTask, addUserToTask} from "../controllers/task.controller"

const router = Router();

router.get("/assigned-by-me", getTasksAssignedByUser);
router.get("/assigned-to-me", getTasksAssignedToUser);
router.post("/create", createTask);
router.post("/add-user", addUserToTask);



export default router;

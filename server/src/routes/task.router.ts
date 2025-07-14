import {Router} from "express"
import {getUserTasks, createTask, addUserToTask} from "../controllers/task.controller"

const router = Router();

router.get("/user-tasks", getUserTasks);
router.post("/create", createTask);
router.post("/add-user", addUserToTask);



export default router;

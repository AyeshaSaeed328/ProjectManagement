import { Router } from "express";
import { getAllProjects, createProject, deleteProject, updateProject, getUserProjects } from "../controllers/project.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.get("/all", verifyJWT, getAllProjects);
router.post("/create", verifyJWT, createProject);
router.delete("/delete/:id", verifyJWT, deleteProject);
router.patch("/update/:id", verifyJWT, updateProject);
router.get("/user", verifyJWT, getUserProjects);

export default router;

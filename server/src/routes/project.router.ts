import { Router } from "express";
import { getAllProjects, createProject, deleteProject, updateProject } from "../controllers/project.controller";

const router = Router();

router.get("/all", getAllProjects);
router.post("/create", createProject);
router.delete("/delete/:id", deleteProject);
router.patch("/update/:id", updateProject);

export default router;

import { Router } from "express";
import { getAllProjects, createProject } from "../controllers/project.controller";

const router = Router();

router.get("/", getAllProjects);
router.post("/", createProject);

export default router;

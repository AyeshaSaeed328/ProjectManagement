import {Router} from "express"
import { createTeam, getAllTeams } from "../controllers/team.controller"

const router = Router();

router.post("/new", createTeam);
router.get("/all", getAllTeams);

export default router;

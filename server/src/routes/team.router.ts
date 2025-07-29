import {Router} from "express"
import { createTeam, getAllTeams, getUserTeam } from "../controllers/team.controller"
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.post("/new", createTeam);
router.get("/all", getAllTeams);
router.get("/me", verifyJWT, getUserTeam);

export default router;

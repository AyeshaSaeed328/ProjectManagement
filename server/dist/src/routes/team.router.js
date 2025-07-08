"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const team_controller_1 = require("../controllers/team.controller");
const router = (0, express_1.Router)();
router.post("/new", team_controller_1.createTeam);
router.get("/all", team_controller_1.getAllTeams);
exports.default = router;

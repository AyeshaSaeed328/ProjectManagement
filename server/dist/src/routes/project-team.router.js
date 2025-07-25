"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectTeam_controller_1 = require("../controllers/projectTeam.controller");
const router = (0, express_1.default)();
router.post('/assign', projectTeam_controller_1.assignTeamToProject);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const router = (0, express_1.Router)();
router.get("/user-tasks", task_controller_1.getUserTasks);
router.post("/create", task_controller_1.createTask);
router.post("/add-user", task_controller_1.addUserToTask);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
// routes import
const project_router_1 = __importDefault(require("./routes/project.router"));
const user_router_1 = __importDefault(require("./routes/user.router"));
const team_router_1 = __importDefault(require("./routes/team.router"));
const task_router_1 = __importDefault(require("./routes/task.router"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)('common'));
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use((0, express_session_1.default)({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session()); // persistent login sessions
+app.get('/', (req, res) => {
    res.send('Welcome to the Project Management API');
});
app.use("/api/v1/projects", project_router_1.default);
app.use("/api/v1/users", user_router_1.default);
app.use("/api/v1/teams", team_router_1.default);
app.use("/api/v1/tasks", task_router_1.default);
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

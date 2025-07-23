import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import session from "express-session";
import passport from 'passport';
import cookieParser from 'cookie-parser';

// routes import
import projectRoutes from "./routes/project.router"
import userRoutes from "./routes/user.router"
import teamRoutes from "./routes/team.router"
import taskRoutes from "./routes/task.router"
import projectTeamRoutes from "./routes/project-team.router"


dotenv.config();
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET!,
    resave: true,
    saveUninitialized: true,
  })
); 
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use(cookieParser());

+
app.get('/', (req, res) => {
  res.send('Welcome to the Project Management API');
});

app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/project-team", projectTeamRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
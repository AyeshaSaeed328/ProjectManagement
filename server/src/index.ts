import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import session from "express-session";
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { Server } from "socket.io";
import { createServer } from 'http';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './utils/types';
import { initializeSocketIO } from './socket';


// routes import
import projectRoutes from "./routes/project.router"
import userRoutes from "./routes/user.router"
import teamRoutes from "./routes/team.router"
import taskRoutes from "./routes/task.router"
import projectTeamRoutes from "./routes/project-team.router"


dotenv.config();
const app = express();


app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET!,
    resave: true,
    saveUninitialized: true,
  })
); 
app.use(cookieParser());

const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

app.set("io", io);



app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));




app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions



+
app.get('/', (req, res) => {
  res.send('Welcome to the Project Management API');
});

app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/project-team", projectTeamRoutes);

initializeSocketIO(io);

const port = process.env.PORT || 4000;
httpServer.listen(port, () => {
  console.log(`Server + Socket.IO running on port ${port}`);
});


export { httpServer };
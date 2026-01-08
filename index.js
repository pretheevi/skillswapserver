const dotenv = require("dotenv");
dotenv.config();
const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");
const wsConnectionHandler = require("./dashboard/chat/websocket");
const cors = require("cors");
const path = require("path");

// Initialize Database
const initializeDb = require("./models/initializeDb");
initializeDb()
  .then(() => {
    console.log("Database initialized");
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1); // Exit the application if DB initialization fails
  });

// Importing route handlers
const userRoutes = require('./dashboard/profile/users')
const authentication = require("./authentication/auth");
const skillRoutes = require("./dashboard/home/skills");
const comment = require("./dashboard/home/commet");
const userFollows = require("./dashboard/profile/userFollower");

// Create server and WebSocket server
const app = express();
const Server = http.createServer(app);
const wss = new WebSocketServer({ server: Server });

// middleware
app.use((req, res, next) => {
  console.log("Origin", req.header.origin);
  next();
});
const allowedOrigins = [
  "https://skillswap-aead1adi9-prethiveerajs-projects.vercel.app",
  "https://skillswap-git-main-prethiveerajs-projects.vercel.app",
  "https://skillswap-zeta-seven.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow curl/Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions)); // Apply CORS to all routes (handles preflight automatically
app.use((err, req, res, next) => {
  // Error handling for CORS
  if (err.message === "Not allowed by CORS") {
    //If a request is blocked, the Error("Not allowed by CORS") will throw
    return res.status(403).json({ error: err.message });
  }
  next(err);
});
app.use(express.json());
app.use((req, res, next) => {
  // just logging incomming client API request for debugging.
  console.log(req.method, req.url);
  next();
});

// console.log("Uploads path:", path.join(__dirname, "uploads"));
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", authentication);
app.use("/api", userRoutes);
app.use("/api", skillRoutes);
app.use("/api", comment);
app.use("/api", userFollows);

// WebSocket connection
wss.on("connection", wsConnectionHandler);

const PORT = process.env.PORT || 8080;
Server.listen(PORT, "0.0.0.0", () =>
  console.log(`listening to PORT:${process.env.PORT}...`)
);

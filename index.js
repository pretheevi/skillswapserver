const dotenv = require("dotenv");
dotenv.config();
const http = require("http");
const express = require("express");
const cors = require("cors");

const connectDB = require("./mongoDB/db");
const authentication = require("./authentication/auth");
const skillRoutes = require("./dashboard/home/skills");
const comment = require('./dashboard/home/commet');

const app = express();
const Server = http.createServer(app);

// connect database
connectDB();

// middleware
app.use((req, res, next) => {
  console.log("Origin", req.header.origin);
  next();
})
const allowedOrigins = [
  "https://skillswap-aead1adi9-prethiveerajs-projects.vercel.app",
  "https://skillswap-git-main-prethiveerajs-projects.vercel.app",
  "https://skillswap-zeta-seven.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow curl/Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
};

// Apply CORS to all routes (handles preflight automatically)
app.use(cors(corsOptions));
// Error handling for CORS
//If a request is blocked, the Error("Not allowed by CORS") will throw. Consider logging it nicely:
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: err.message });
  }
  next(err);
});




app.use(express.json());
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use("/api", authentication);
app.use("/api", skillRoutes);
app.use('/api', comment)

const PORT = process.env.PORT || 8080;
Server.listen(PORT, "0.0.0.0", () =>
  console.log(`listening to PORT:${process.env.PORT}...`)
);

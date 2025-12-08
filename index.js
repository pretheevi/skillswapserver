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
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use("/api", authentication);
app.use("/api", skillRoutes);
app.use('/api', comment)

Server.listen(process.env.PORT, "0.0.0.0", () =>
  console.log(`listening to PORT:${process.env.PORT}...`)
);

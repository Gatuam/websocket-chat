import { Server } from "socket.io";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import cors from "cors";

const app = express();
const server = createServer(app);

const whitelist = ["http://localhost:5173"];
const corsOptions = {
  origin: function (origin: any, callback: any) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.get("/", cors(corsOptions), (req: Request, res: Response) => {
  res.send("hello");
});
const io = new Server(server, {});
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
});

server.listen(4500, () => {
  console.log("server connected");
});

import { Server } from "socket.io";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import cors from "cors";

const app = express();
const server = createServer(app);

const corsOptions = {
  origin: "https://websocket-chat-delta.vercel.app",
  methods: ["GET", "POST"],
};
app.use(cors(corsOptions));

app.get("/", (req: Request, res: Response) => {
  res.send("hello");
});
const Room = "group";
const io = new Server(server, {
  cors: {
    origin: "https://websocket-chat-delta.vercel.app/",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("joinRoom", async (userName: string) => {
    console.log(`${userName} is joing the room`);

    await socket.join(Room);
    socket.to(Room).emit("roomNotice", userName);
  });

  socket.on("chat", (mssage: string) => {
    socket.to(Room).emit("chatNotice", mssage);
  });
  socket.on("typing", (userName) => {
    socket.to(Room).emit("typing", userName);
  });
  socket.on("stopTyping", (userName) => {
    socket.to(Room).emit("stopTyping", userName);
  });
});

server.listen(4500, () => {
  console.log("server connected");
});

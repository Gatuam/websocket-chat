import { io } from "socket.io-client";

export default function connectWs() {
  return io("https://websocket-chat-vmrp.onrender.com");
}

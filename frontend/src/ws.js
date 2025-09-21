import { io } from "socket.io-client";

export default function connectWs() {
  return io("http://localhost:4500");
}

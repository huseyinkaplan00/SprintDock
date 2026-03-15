import { io } from "socket.io-client";

const socket = io("http://localhost:4000/realtime", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("connected", socket.id);
  socket.emit("join_project", "p1");
  console.log("joined project p1");
});

socket.on("task.updated", (data) => {
  console.log("task.updated", data);
});

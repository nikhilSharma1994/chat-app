import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "../lib/db.js";
import userRouter from "../routes/userRoutes.js";
import messageRouter from "../routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

// Socket server
export const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// store online users
export const userSocketMap = {};

// socket connection
io.on("connection", (socket) => {

  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // call offer
  socket.on("call-offer", ({ to, offer, callType }) => {

    const receiverSocketId = userSocketMap[to];

    console.log("call attempt");
    console.log("from", userId);
    console.log("to", to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming-call", {
        from: userId,
        offer,
        callType
      });
    } else {
      console.log("receiver not connected");
    }

  });

  // call answer
  socket.on("call-answer", ({ to, answer }) => {

    const receiverSocketId = userSocketMap[to];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-answer", { answer });
    }

  });

  // ice candidate
  socket.on("ice-candidate", ({ to, candidate }) => {

    const receiverSocketId = userSocketMap[to];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", { candidate });
    }

  });

  // call rejected
  socket.on("call-rejected", ({ to }) => {

    const receiverSocketId = userSocketMap[to];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-rejected", { from: userId });
    }

  });

  // call ended
  socket.on("call-ended", ({ to }) => {

    const receiverSocketId = userSocketMap[to];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-ended", { from: userId });
    }

  });

  // disconnect
  socket.on("disconnect", () => {

    console.log("User disconnected:", userId);

    delete userSocketMap[userId];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

  });

});

// middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// routes
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/api/status", (req, res) => {
  res.send("Server is live");
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// DB connection
await connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
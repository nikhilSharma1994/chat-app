import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from '../lib/db.js';
import userRouter from '../routes/userRoutes.js';
import messageRouter from '../routes/messageRoutes.js';
import { Server } from 'socket.io';


// create express app and http server 

const app = express();
const server = http.createServer(app);

// initialize socket.io server 
export const io = new Server(server, {
  cors: { origin: "*" }
})

// store online users

export const userSocketMap = {};      // {userId : socketId}  in this empty object 

// Socket.io connection handler
   io.on('connection', (socket) => {
  // contains information attached during the connection handshake (headers,query,params,auth etc )
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);

  if (userId) userSocketMap[userId] = socket.id;



  // emit online users to all connected clients 

  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on("call-answer", ({ to, answer }) => {
    const receiverSocketId = userSocketMap[to];

    console.log(" Forwarding call-answer to:", to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-answer", {
        answer
      });
    } else {
      console.log(" Caller socket not found for call-answer");
      
    }



    socket.on('call-ended', ({ to }) => {
  const receiverSocketId = userSocketMap[to];

  console.log(' Call ended by', userId, ' notifying', to);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit('call-ended', {
      from: userId
    });
  } else {
    console.log('Receiver not found for call-ended');
  }
});

  });



  // handling a call initiated by userA to userB or vice-versa 

  socket.on('call-offer', ({ to, offer, callType }) => {
    const receiverSocketId = userSocketMap[to];

    console.log("call attempt");
    console.log("from", userId);
    console.log("to", to);
    console.log("Receiver socket id", receiverSocketId);
    console.log("📡 Forwarding call-offer to", to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming-call", {
        from: userId,
        offer,
        callType
      });
    } else {
      console.log('reciever not connected or socket miing ');

    }





  });


  socket.on("ice-candidate", ({ to, candidate }) => {
    const receiverSocketId = userSocketMap[to];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", {
        candidate
      });
    }
  });



  socket.on('disconnect', () => {
    console.log('User Disconnected ', userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap))



  })


  socket.on('call-rejected', ({ to }) => {
  const receiverSocketId = userSocketMap[to];

  console.log(' Call rejected by', userId, 'notifying', to);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit('call-rejected', {
      from: userId
    });
  } else {
    console.log('Caller socket not found for call-rejected');
  }
});


})

// middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(cors());


// routes setup
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/status", (req, res) => res.send("server is live"));
app.use('/api/auth', userRouter)
app.use('/api/messages', messageRouter)

// connect to mongodb
await connectDB();

const port = process.env.PORT || 5000;

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on ${port}`);
}

);


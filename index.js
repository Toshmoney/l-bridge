const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDB = require("./db/connect");

// routes
const authRoutes = require("./routes/authRoutes");
const templateRoutes = require("./routes/templateRoutes");
const documentRoutes = require("./routes/documentRoutes");
const customTemplateRoutes = require("./routes/customTemplateRoutes");
const lawyerRoutes = require("./routes/lawyerRoutes");
const consultationRoutes = require("./routes/consultation");
const purchaseRoutes = require("./routes/purchaseRoute");
const walletRoutes = require("./routes/walletRoutes");
const chatRoutes = require("./routes/chatRoutes");

const Chat = require("./models/Chats");

dotenv.config();
const app = express();
const port = 4000;

// middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "https://lawbridge.com.ng", credentials: true }));
app.use(morgan("dev"));

app.get("/test", (req, res) => {
  res.json({ msg: "Server working perfectly well!" });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/custom-templates", customTemplateRoutes);
app.use("/api/lawyers", lawyerRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", walletRoutes);
app.use("/api", chatRoutes);

// Create HTTP server and wrap socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://lawbridge.com.ng", // frontend URL
    methods: ["GET", "POST"],
  },
});

// Track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // User joins
  socket.on("join", (userId) => {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, []);
      // Notify everyone this user is online
      io.emit("userOnline", userId);
    }
    onlineUsers.get(userId).push(socket.id);
    console.log("User online:", userId, onlineUsers.get(userId));
  });

  // typing indicators
  socket.on("typing", ({ senderId, receiverId }) => {
  const receiverSockets = onlineUsers.get(receiverId) || [];
  receiverSockets.forEach((sockId) => {
    io.to(sockId).emit("userTyping", { senderId });
  });
});

socket.on("stopTyping", ({ senderId, receiverId }) => {
  const receiverSockets = onlineUsers.get(receiverId) || [];
  receiverSockets.forEach((sockId) => {
    io.to(sockId).emit("userStopTyping", { senderId });
  });
});

  // Send message
  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    try {
      const chat = await Chat.create({
        sender: senderId,
        receiver: receiverId,
        message,
      });

      const populatedChat = await Chat.findById(chat._id)
        .populate("sender", "name email")
        .populate("receiver", "name email");

      // Send to receiver if online
      const receiverSockets = onlineUsers.get(receiverId) || [];
      receiverSockets.forEach((sockId) => {
        io.to(sockId).emit("receiveMessage", populatedChat);
      });

      // Also send back to sender
      const senderSockets = onlineUsers.get(senderId) || [];
      senderSockets.forEach((sockId) => {
        io.to(sockId).emit("receiveMessage", populatedChat);
      });
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("errorMessage", { message: "Failed to send message" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (let [userId, sockets] of onlineUsers.entries()) {
      const updatedSockets = sockets.filter((id) => id !== socket.id);

      if (updatedSockets.length > 0) {
        onlineUsers.set(userId, updatedSockets);
      } else {
        onlineUsers.delete(userId);
        console.log("User offline:", userId);
        // Notify everyone this user went offline
        io.emit("userOffline", userId);
      }
    }
  });
});

// Start HTTP + Socket.IO server
server.listen(port, async () => {
  console.log(`Server + Socket.IO running at http://localhost:${port}`);
  await connectDB();
});

// routes/chatRoutes.js
const express = require("express");
const Chat = require("../models/Chats");
const { isLoggin:authMiddleware } = require("../middleware/Authenticate");
const { sendMessageNotificationEmail } = require("../helper/sendMail");

const router = express.Router();

// get single message thread between two users
router.get("/chat/:receiverId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { receiverId } = req.params;

    const chats = await Chat.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a new message
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const chat = await Chat.create({
      sender: req.user.userId,
      receiver: receiverId,
      message,
    });

    console.log("New chat created:", chat);
    

    const populatedChat = await Chat.findById(chat._id)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    // send notification email to receiver about new message
    console.log("chats",populatedChat);
    
    await sendMessageNotificationEmail(
      populatedChat.receiver.email,
      populatedChat.receiver.name,
      populatedChat.sender.name,
      message,
      populatedChat._id
    );

    // emit real-time event using WebSocket (if implemented)
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId).emit("newMessage", populatedChat);
    }

    

    res.status(201).json(populatedChat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch conversation list (like inbox)
router.post("/chats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all chats involving this user
    const chats = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    // Group by conversation partner
    const convMap = new Map();
    chats.forEach((chat) => {
      const partner =
        chat.sender._id.toString() === userId ? chat.receiver : chat.sender;

      if (!convMap.has(partner._id.toString())) {
        convMap.set(partner._id.toString(), {
          user: partner,
          lastMessage: chat.message,
          lastDate: chat.createdAt,
        });
      }
    });

    res.json([...convMap.values()]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all chats involving this user
    const chats = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    // Group by the other user
    const conversationsMap = new Map();

    chats.forEach((chat) => {
      const otherUser =
        chat.sender._id.toString() === userId
          ? chat.receiver
          : chat.sender;

      if (!conversationsMap.has(otherUser._id.toString())) {
        conversationsMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: chat.message,
          lastDate: chat.createdAt,
        });
      }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
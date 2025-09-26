// routes/chatRoutes.js
const express = require("express");
const Chat = require("../models/Chats");
const { isLoggin:authMiddleware } = require("../middleware/Authenticate");

const router = express.Router();

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

// ✅ Send a new message
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const chat = await Chat.create({
      sender: req.user.userId,
      receiver: receiverId,
      message,
    });

    const populatedChat = await Chat.findById(chat._id)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.status(201).json(populatedChat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Fetch conversation list (like inbox)
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

module.exports = router;
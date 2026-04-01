const messageModel = require("../schemas/messages");
const mongoose = require("mongoose");

module.exports = {
  // POST /api/v1/messages
  sendMessage: async function (req, res) {
    try {
      const { to, text } = req.body;
      const from = req.user._id;

      if (!to || !text) {
        return res.status(400).send({
          success: false,
          message: "Recipient (to) and message content (text) are required.",
        });
      }

      // Logic to determine if it's a file or text
      // We check if the text looks like a path or has a file extension
      const fileExtensions = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".docx", ".zip", ".rar", ".txt"];
      const isFilePath = text.startsWith("/uploads/") || 
                         text.startsWith("uploads/") ||
                         fileExtensions.some(ext => text.toLowerCase().endsWith(ext));

      const newMessage = new messageModel({
        from: from,
        to: to,
        messageContent: {
          type: isFilePath ? "file" : "text",
          text: text,
        },
      });

      await newMessage.save();

      res.status(200).send({
        success: true,
        data: newMessage,
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/v1/messages/:userID
  getMessagesWithUser: async function (req, res) {
    try {
      const currentUserId = req.user._id;
      const otherUserId = req.params.userID;

      if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
        return res.status(400).send({
          success: false,
          message: "Invalid User ID",
        });
      }

      const messages = await messageModel
        .find({
          $or: [
            { from: currentUserId, to: otherUserId },
            { from: otherUserId, to: currentUserId },
          ],
        })
        .sort({ createdAt: 1 })
        .populate("from", "username avatarUrl fullName")
        .populate("to", "username avatarUrl fullName");

      res.status(200).send({
        success: true,
        data: messages,
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/v1/messages/
  getConversationList: async function (req, res) {
    try {
      const currentUserId = req.user._id;

      const conversations = await messageModel.aggregate([
        {
          $match: {
            $or: [
              { from: new mongoose.Types.ObjectId(currentUserId) },
              { to: new mongoose.Types.ObjectId(currentUserId) },
            ],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$from", new mongoose.Types.ObjectId(currentUserId)] },
                "$to",
                "$from",
              ],
            },
            lastMessage: { $first: "$$ROOT" },
          },
        },
        {
          $lookup: {
            from: "users", // The collection name for 'user' model is usually 'users'
            localField: "_id",
            foreignField: "_id",
            as: "otherUser",
          },
        },
        {
          $unwind: "$otherUser",
        },
        {
          $project: {
            _id: 0,
            otherUser: {
              _id: 1,
              username: 1,
              avatarUrl: 1,
              fullName: 1,
            },
            lastMessage: 1,
          },
        },
        {
          $sort: { "lastMessage.createdAt": -1 },
        },
      ]);

      res.status(200).send({
        success: true,
        data: conversations,
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        message: error.message,
      });
    }
  },
};

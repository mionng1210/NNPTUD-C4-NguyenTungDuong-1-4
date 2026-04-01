const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messages");
const { CheckLogin } = require("../utils/authHandler");

/**
 * @route GET /api/v1/messages/
 * @desc Get all conversations (last message of each user you've chatted with)
 * @access Private
 */
router.get("/", CheckLogin, messageController.getConversationList);

/**
 * @route POST /api/v1/messages/
 * @desc Send a message (text or file path)
 * @access Private
 */
router.post("/", CheckLogin, messageController.sendMessage);

/**
 * @route GET /api/v1/messages/:userID
 * @desc Get chat history with a specific user
 * @access Private
 */
router.get("/:userID", CheckLogin, messageController.getMessagesWithUser);

module.exports = router;

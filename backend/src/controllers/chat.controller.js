// controllers/chatController.js
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { getIO } from "../utils/socket.js";
import { sendPushNotification } from "../utils/notifications.js";


/**
 * Start a chat between two matched users
 */
export const startChat = async (req, res) => {
  const { userId, receiverId } = req.body;

  if (!userId || !receiverId) {
    return res
      .status(400)
      .json({ error: "UserId and ReceiverId are required." });
  }

  try {
    // ✅ Find existing conversation or create a new one
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, receiverId],
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error starting chat:", error);
    res.status(500).json({ error: "Failed to start conversation." });
  }
};

/**
 * Get all conversations of a
 */
export const getUserChats = async (req, res) => {
  const { userId } = req.params;

  try {
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "fullName avatar1")
      .sort({ updatedAt: -1 })
      .lean(); // Convert to plain JS objects for easier manipulation

    const formattedConversations = conversations.map((conversation) => {
      const otherParticipant = conversation.participants.find(
        (participant) => participant._id.toString() !== userId
      );

      return {
        _id: conversation._id,
        otherParticipant: {
          _id: otherParticipant?._id,
          fullName: otherParticipant?.fullName,
          avatar1: otherParticipant?.avatar1,
        },
        lastMessage: conversation.lastMessage
          ? {
              senderId: conversation.lastMessage.senderId,
              message: conversation.lastMessage.message,
              createdAt: conversation.lastMessage.createdAt,
              isRead: conversation.lastMessage.isRead,
            }
          : null,
        updatedAt: conversation.updatedAt,
      };
    });
    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Error retrieving chats:", error);
    res.status(500).json({ error: "Failed to retrieve conversations." });
  }
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (req, res) => {
  const { conversationId, senderId, message: text, replyTo } = req.body;
  const io = getIO();

  if (!conversationId || !senderId || !text) {
    return res
      .status(400)
      .json({ error: "ConversationId, senderId, and message are required." });
  }

  try {
    const newMessage = new Message({
      conversationId,
      senderId,
      message: text,
      replyTo: replyTo || null,
    });
    await newMessage.save();

    // ✅ Fetch the saved message with populated replyTo
    const populatedMsg = await Message.findById(newMessage._id)
      .populate({ path: "replyTo", select: "message senderId" })
      .lean();

    // ✅ Update lastMessage in Conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        senderId,
        message: text,
        createdAt: newMessage.createdAt,
        isRead: false,
      },
      updatedAt: Date.now(),
    });

    // ✅ Emit message using Socket.IO
    io.to(conversationId).emit("newMessage", {
      _id: populatedMsg._id,
      text: populatedMsg.message,
      senderId: populatedMsg.senderId,
      conversationId: populatedMsg.conversationId,
      createdAt: populatedMsg.createdAt,
      replyTo: populatedMsg.replyTo
        ? {
            _id: populatedMsg.replyTo._id,
            text: populatedMsg.replyTo.message,
            senderId: populatedMsg.replyTo.senderId,
          }
        : undefined,
    });

    // ✅ Send push notification to the recipient
    try {
      // Get conversation with participants
      const conversation = await Conversation.findById(conversationId).populate({
        path: 'participants',
        select: 'fullName avatar1 pushToken'
      });

      if (conversation && conversation.participants) {
        // Find the recipient (not the sender)
        const recipient = conversation.participants.find(
          participant => participant._id.toString() !== senderId.toString()
        );

        // Find the sender for sender info
        const sender = conversation.participants.find(
          participant => participant._id.toString() === senderId.toString()
        );

        if (recipient && recipient.pushToken && sender) {
          // Send push notification
          await sendPushNotification(
            recipient.pushToken,
            `${sender.fullName}`, // Title: sender's name
            text, // Body: the message text
            {
              type: "message",
              conversationId: conversationId,
              senderId: senderId,
              senderName: sender.fullName,
              senderAvatar: sender.avatar1,
              messageId: populatedMsg._id.toString()
            }
          );
          console.log(`✅ Push notification sent to ${recipient.fullName}`);
        } else {
          if (!recipient) {
            console.log("❌ No recipient found in conversation");
          } else if (!recipient.pushToken) {
            console.log("❌ Recipient has no push token");
          } else if (!sender) {
            console.log("❌ Sender not found in conversation");
          }
        }
      }
    } catch (notificationError) {
      console.error("❌ Error sending push notification:", notificationError);
      // Don't fail the message sending if notification fails
    }

    res.status(201).json({
      _id: populatedMsg._id,
      text: populatedMsg.message,
      senderId: populatedMsg.senderId,
      conversationId: populatedMsg.conversationId,
      createdAt: populatedMsg.createdAt,
      replyTo: populatedMsg.replyTo
        ? {
            _id: populatedMsg.replyTo._id,
            text: populatedMsg.replyTo.message,
            senderId: populatedMsg.replyTo.senderId,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
};

/**
 * Get all messages in a chat
 */
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const messages = await Message.find({
      conversationId,
      deletedBy: { $ne: req.user._id }, // ✅ exclude messages deleted by current user
    })
      .sort({ createdAt: 1 })
      .populate({
        path: "replyTo",
        select: "message senderId", // only pull these fields
      })
      .lean();

    const formattedMessages = messages.map((msg) => ({
      _id: msg._id,
      text: msg.message, // This is correct since your model uses 'message'
      senderId: msg.senderId,
      createdAt: msg.createdAt,
      isRead: msg.isRead,
      replyTo: msg.replyTo
        ? {
            _id: msg.replyTo._id,
            text: msg.replyTo.message, // Note the field name
            senderId: msg.replyTo.senderId,
          }
        : undefined,
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Failed to retrieve messages." });
  }
};

export const deleteMessagesForUser = async (req, res) => {
  //delete all messages only for the user who clicked the option
  const { conversationId } = req.params;
  const userId = req.user._id;

  try {
    await Message.updateMany(
      { conversationId, deletedBy: { $ne: userId } },
      { $push: { deletedBy: userId } }
    );

    res.status(200).json({ message: "Messages hidden for current user." });
  } catch (err) {
    console.error("Failed to hide messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessagesForMe = async (req, res) => {
  //delete secific message or group of messages only for the user who clicked the option
  const { messageIds } = req.body;
  const userId = req.user._id;

  if (!messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({ error: "messageIds are required." });
  }

  try {
    await Message.updateMany(
      { _id: { $in: messageIds }, deletedBy: { $ne: userId } },
      { $push: { deletedBy: userId } }
    );

    res.status(200).json({ message: "Messages deleted for you." });
  } catch (error) {
    console.error("Error deleting messages for me:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessagesForEveryone = async (req, res) => {
  const { messageIds, conversationId } = req.body;
  const userId = req.user._id;

  if (!messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({ error: "messageIds are required." });
  }

  if (!conversationId) {
    return res.status(400).json({ error: "conversationId is required." });
  }

  try {
    const messages = await Message.find({ _id: { $in: messageIds } });

    const notOwned = messages.filter(
      (msg) => msg.senderId.toString() !== userId.toString()
    );

    if (notOwned.length > 0) {
      return res.status(403).json({
        error: "You can only delete your own messages for everyone.",
      });
    }

    await Message.deleteMany({ _id: { $in: messageIds } });

    // ✅ Emit to the conversation room
    const io = getIO();
    io.to(conversationId).emit("messageDeleted", { messageIds });

    res.status(200).json({ message: "Messages deleted for everyone." });
  } catch (error) {
    console.error("Error deleting messages for everyone:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const express = require("express");
const mongoose = require("mongoose");

// ==================== MODELS ====================

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

// Conversation Schema
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

// ==================== CONTROLLERS ====================

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { message, senderId } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage Controller", error.message);
    res.status(500).json({ error: "Internal Server Error..." });
  }
};

// Get chat history
const getMessages = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { senderId } = req.body; // senderId will be sent in the body

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages.map((msg) => ({
      ...msg._doc,
      message: msg.message,
    }));

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages Controller", error.message);
    res.status(500).json({ error: "Internal Server Error..." });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { senderId } = req.body; // senderId will be sent in the body

    const message = await Message.findOne({ _id: messageId, senderId });

    if (!message) {
      return res.status(404).json({ message: "Message not found or unauthorized" });
    }

    await Message.findByIdAndDelete(messageId);
    await Conversation.updateOne(
      { messages: messageId },
      { $pull: { messages: messageId } }
    );

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage Controller", error.message);
    res.status(500).json({ error: "Internal Server Error..." });
  }
};

// ==================== SOCKET.IO ====================

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("sendMessage", async (data) => {
      const { receiverId, message, senderId } = data;

      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, receiverId],
        });
      }

      const newMessage = new Message({
        senderId,
        receiverId,
        message,
      });

      conversation.messages.push(newMessage._id);

      await Promise.all([conversation.save(), newMessage.save()]);

      io.to(receiverId).emit("receiveMessage", {
        senderId,
        message,
        timestamp: newMessage.createdAt,
      });
    });
    socket.on("receiveMessage", (data) => {
      console.log("New Message:", data);
    });
//delete message
    socket.on("deleteMessage", async (data) => {
      
      try {
        const { messageId, senderId } = data;
    
        const message = await Message.findOne({ _id: messageId, senderId });
    
        if (!message) {
          socket.emit("error", { message: "Message not found or unauthorized" });
          return;
        }
    
        await Message.findByIdAndDelete(messageId);
        await Conversation.updateOne(
          { messages: messageId },
          { $pull: { messages: messageId } }
        );
    
        io.emit("messageDeleted", { messageId }); // Notify all users
      } catch (error) {
        console.error("Error in deleteMessage socket:", error.message);
        socket.emit("error", { message: "Internal Server Error" });
      }
    });   
//

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

  });
};

// ==================== ROUTES ====================

const router = express.Router();

// POST /message/:id (send message to user with id)
router.post("/:id", sendMessage);

// GET /message/:id (get chat history with user id)
router.get("/:id", getMessages);

// DELETE /message/:messageId (delete a specific message by id)
router.delete("/delete/:messageId", deleteMessage);

module.exports = router;
module.exports=handleSocketConnection;

// const express = require("express");
// const mongoose = require("mongoose");

// // ==================== MODELS ====================

// // Message Schema
// const messageSchema = new mongoose.Schema(
//   {
//     senderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     receiverId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     message: {
//       type: String,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// const Message = mongoose.model("Message", messageSchema);

// // Conversation Schema
// const conversationSchema = new mongoose.Schema(
//   {
//     participants: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//       },
//     ],
//     messages: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Message",
//       },
//     ],
//   },
//   { timestamps: true }
// );

// const Conversation = mongoose.model("Conversation", conversationSchema);

// // ==================== CONTROLLERS ====================

// // Send a message
// const sendMessage = async (req, res) => {
//   try {
//     const { id: receiverId } = req.params;
//     const { message, senderId } = req.body;

//     let conversation = await Conversation.findOne({
//       participants: { $all: [senderId, receiverId] },
//     });

//     if (!conversation) {
//       conversation = new Conversation({
//         participants: [senderId, receiverId],
//       });
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       message,
//     });

//     conversation.messages.push(newMessage._id);

//     await Promise.all([conversation.save(), newMessage.save()]);

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.log("Error in sendMessage Controller", error.message);
//     res.status(500).json({ error: "Internal Server Error..." });
//   }
// };

// // Get chat history
// const getMessages = async (req, res) => {
//   try {
//     const { id: receiverId } = req.params;
//     const { senderId } = req.body; // senderId will be sent in the body

//     const conversation = await Conversation.findOne({
//       participants: { $all: [senderId, receiverId] },
//     }).populate("messages");

//     if (!conversation) return res.status(200).json([]);

//     const messages = conversation.messages.map((msg) => ({
//       ...msg._doc,
//       message: msg.message,
//     }));

//     res.status(200).json(messages);
//   } catch (error) {
//     console.log("Error in getMessages Controller", error.message);
//     res.status(500).json({ error: "Internal Server Error..." });
//   }
// };

// // Delete a message
// const deleteMessage = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//     const { senderId } = req.body; // senderId will be sent in the body

//     const message = await Message.findOne({ _id: messageId, senderId });

//     if (!message) {
//       return res.status(404).json({ message: "Message not found or unauthorized" });
//     }

//     await Message.findByIdAndDelete(messageId);
//     await Conversation.updateOne(
//       { messages: messageId },
//       { $pull: { messages: messageId } }
//     );

//     res.status(200).json({ message: "Message deleted successfully" });
//   } catch (error) {
//     console.log("Error in deleteMessage Controller", error.message);
//     res.status(500).json({ error: "Internal Server Error..." });
//   }
// };

// // ==================== SOCKET.IO ====================

// const handleSocketConnection = (io) => {
//   io.on("connection", (socket) => {
//     console.log("A user connected:", socket.id);

//     socket.on("sendMessage", async (data) => {
//       const { receiverId, message, senderId } = data;

//       let conversation = await Conversation.findOne({
//         participants: { $all: [senderId, receiverId] },
//       });

//       if (!conversation) {
//         conversation = new Conversation({
//           participants: [senderId, receiverId],
//         });
//       }

//       const newMessage = new Message({
//         senderId,
//         receiverId,
//         message,
//       });

//       conversation.messages.push(newMessage._id);

//       await Promise.all([conversation.save(), newMessage.save()]);

//       io.to(receiverId).emit("receiveMessage", {
//         senderId,
//         message,
//         timestamp: newMessage.createdAt,
//       });
//     });

//     socket.on("receiveMessage", (data) => {
//       console.log("New Message:", data);
//     });

//     //delete message
//     socket.on("deleteMessage", async (data) => {
//       try {
//         const { messageId, senderId } = data;

//         const message = await Message.findOne({ _id: messageId, senderId });

//         if (!message) {
//           socket.emit("error", { message: "Message not found or unauthorized" });
//           return;
//         }

//         await Message.findByIdAndDelete(messageId);
//         await Conversation.updateOne(
//           { messages: messageId },
//           { $pull: { messages: messageId } }
//         );

//         io.emit("messageDeleted", { messageId }); // Notify all users
//       } catch (error) {
//         console.error("Error in deleteMessage socket:", error.message);
//         socket.emit("error", { message: "Internal Server Error" });
//       }
//     });

//     socket.on("disconnect", () => {
//       console.log("User disconnected:", socket.id);
//     });
//   });
// };

// // ==================== ROUTES ====================

// const express = require("express");
// const router = express.Router();

// // POST /message/:id (send message to user with id)
// router.post("/:id", sendMessage);

// // GET /message/:id (get chat history with user id)
// router.get("/:id", getMessages);

// // DELETE /message/:messageId (delete a specific message by id)
// router.delete("/delete/:messageId", deleteMessage);

// module.exports = router;
// module.exports = handleSocketConnection;
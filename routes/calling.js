const express = require("express");

const mongoose = require("mongoose");



//=============Schema========================


const CallSchema = new mongoose.Schema({
    callerId: String,
    receiverId: String,
    offer: Object,
    answer: Object,
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    status: { type: String, enum: ["ongoing", "ended"], default: "ongoing" },
  });
  
  const Call = mongoose.model("Call", CallSchema);



  //==============Controller=================



const createCall = async (req, res) => {
    try {
      const { callerId, receiverId, offer } = req.body;
      const call = new Call({ callerId, receiverId, offer });
      await call.save();
      res.status(201).json({ message: "Call created successfully", call });
    } catch (error) {
      res.status(500).json({ message: "Error creating call", error });
    }
  };
  
  // Get all call records
   const getAllCalls = async (req, res) => {
    try {
      const calls = await Call.find();
      res.status(200).json(calls);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calls", error });
    }
  };
  
  // Get a specific call by ID
  const getCallById = async (req, res) => {
    try {
      const call = await Call.findById(req.params.id);
      if (!call) return res.status(404).json({ message: "Call not found" });
      res.status(200).json(call);
    } catch (error) {
      res.status(500).json({ message: "Error fetching call", error });
    }
  };
  
  // Delete a call by ID
  const deleteCall = async (req, res) => {
    try {
      const call = await Call.findByIdAndDelete(req.params.id);
      if (!call) return res.status(404).json({ message: "Call not found" });
      res.status(200).json({ message: "Call deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting call", error });
    }
  };
  

  
  //===============Socket Connection=================
  const handleWebRTC = (io) => {
    io.on("connection", (socket) => {
      console.log(`User Connected: ${socket.id}`);
  
      socket.on("call-user", async ({ callerId, receiverId, offer }) => {
        const call = new Call({ callerId, receiverId, offer });
        await call.save();
        io.to(receiverId).emit("incoming-call", { callerId, offer });
      });
  
      socket.on("answer-call", async ({ callerId, receiverId, answer }) => {
        await Call.findOneAndUpdate({ callerId, receiverId, status: "ongoing" }, { answer });
        io.to(callerId).emit("call-answered", { receiverId, answer });
      });
  
      socket.on("end-call", async ({ callerId, receiverId }) => {
        await Call.findOneAndUpdate(
          { callerId, receiverId, status: "ongoing" },
          { status: "ended", endTime: new Date() }
        );
        io.to(receiverId).emit("call-ended", { callerId });
        io.to(callerId).emit("call-ended", { receiverId });
      });
  
      socket.on("disconnect", () => {
        console.log(`User Disconnected: ${socket.id}`);
      });
    });
  };



  
  const router = express.Router();

  router.post("/calls", createCall);
  router.get("/calls", getAllCalls);
  router.get("/calls/:id", getCallById);
  router.delete("/calls/:id", deleteCall);
  


 
  module.exports = {router,handleWebRTC};
  
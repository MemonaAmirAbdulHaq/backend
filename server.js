const express = require('express');
const dotenv = require('dotenv');
const signup = require('./routes/signup.js');
const confirmPassword = require('./routes/signup.js');
const signin=require('./routes/signin.js')
const forgotpassword=require('./routes/forgotpassword')
const calling=require('./routes/calling.js');

const messages=require('./routes/message.js');
const connectMongodb =require ("./utils/db.js");
//const socketIo = require("socket.io");
const handleSocketConnection  = require("./routes/message.js"); // Import the function
//const handleWebRTC =require('./routes/calling.js')
const { handleWebRTC } = require('./routes/calling.js');
const http = require('http');
const { Server } = require('socket.io');

const PORT=process.env.PORT ;
dotenv.config();
const app=express();
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
  cors: {
      origin: '*',
      methods: ['GET', 'POST','DELETE']
  }
},); // Attach Socket.io to the HTTP serve





app.use(express.json());


// Set up socket connection handler
handleSocketConnection(io); // Pass the io instance here
handleWebRTC(io);


app.use('/signup',signup);
app.use('/signup',confirmPassword);
app.use('/signin',signin);
app.use('/forgotpassword',forgotpassword);
app.use("/message", messages);

app.use("/calling",calling.router);

server.listen(PORT,()=>{
    connectMongodb();
  console.log(`Server is Running `)
});
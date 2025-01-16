import app from "./app.js";
import cloudinary from "cloudinary";
import { createServer } from "http"; // Import HTTP server
import { Server } from "socket.io"; // Import Socket.IO

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

// Create HTTP server
const server = createServer(app); // Use the same app for the HTTP server

// Initialize Socket.IO with the same server instance
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL], // Make sure the frontend URL is correct
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// WebSocket event handling
// On the server-side (in your WebSocket handling code)
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-room", (applicationId, callback) => {
    socket.join(applicationId); // Join the same room based on application ID
    console.log(`User ${socket.id} joined room: ${applicationId}`);

    // Acknowledge the join request
    callback({ success: true });
  });

  socket.on("interview-scheduled", ({ applicationId, interviewDate, interviewTime }) => {
    // You can notify both participants (employer and job seeker) to join the call
    io.to(applicationId).emit("join-room", applicationId); // Notify both the employer and job seeker
  });

  socket.on("start-video-call", ({ roomId, applicationId }) => {
    // Emit event to both participants that the video call is starting
    io.to(roomId).emit("start-video-call", { roomId, applicationId });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

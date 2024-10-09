const { Server } = require("socket.io");

// Initialize the Socket.io server with CORS configuration
const io = new Server({
  cors: {
    origin: "http://localhost:3000", // Allow requests only from this origin
  },
});

// Online Users Array
let onlineUsers = [];

// Helper function to find a user by userId
const findUser = (userId) => onlineUsers.find((user) => user.userId === userId);

// Add user to the onlineUsers array if not already present
const addUser = (userId, socketId) => {
  if (!findUser(userId)) {
    onlineUsers.push({ userId, socketId });
  }
};

// Remove a user by their socket ID
const removeUserBySocketId = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

// Emit the updated online users list to all clients
const emitOnlineUsers = () => {
  io.emit("getOnlineUsers", onlineUsers);
};

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining the chat
  socket.on("addNewUser", (userId) => {
    addUser(userId, socket.id);
    emitOnlineUsers(); // Send the updated list of online users
  });

  // Handle sending a private message
  socket.on("sendMessage", (newMessage) => {
    const user = findUser(newMessage.userId);
    console.log("user is sending newMessage ", user);

    if (user) {
      io.to(user.socketId).emit("getMessage", newMessage);
      console.log(`Message sent to user ${user.userId}`);
    } else {
      console.log(`User with id ${newMessage.userId} is not online`);
    }
  });

  // Handle sending a notification
  socket.on("sendNotification", ({ newNotification: notification }) => {
    console.log("nottttttttttttt", notification);
    const user = findUser(notification.user_id);
    console.log("user is sending notification ", user);
    if (user) {
      io.to(user.socketId).emit("getNotification", notification);
      console.log(`Notification sent to user ${user.userId}`);
    } else {
      console.log(`User with id ${notification.user_id} is not online`);
    }
  });

  // Handle user typing in chat
  socket.on("sendTyping", (userTyping) => {
    const user = findUser(userTyping.userTypingId);
    console.log("user is typing ", user);
    if (user) {
      io.to(user.socketId).emit("getTyping", userTyping);
      console.log(`User ${user.userId} is typing in chat ${userTyping.chatId}`);
    } else {
      console.log(`User with id ${userTyping.userTypingId} is not online`);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    removeUserBySocketId(socket.id);
    emitOnlineUsers(); // Update the list of online users
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the Socket.io server on port 9000
io.listen(9000);
console.log("Socket.io server is running on port 9000");

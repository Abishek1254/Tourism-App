const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();
const connectDB = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB();

// Rate limiting for chat
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many messages sent, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Socket.IO Chat Handling
const chatNamespace = io.of('/chat');
const activeChats = new Map(); // Track active chat sessions
const agentSockets = new Map(); // Track online agents

chatNamespace.on('connection', (socket) => {
  console.log('Chat client connected:', socket.id);

  // Join chat room
  socket.on('join_chat', (data) => {
    const { sessionId, userType } = data; // userType: 'user' or 'agent'
    
    socket.join(sessionId);
    
    if (userType === 'agent') {
      agentSockets.set(socket.id, { sessionId, agentId: data.agentId });
    }
    
    activeChats.set(sessionId, {
      ...activeChats.get(sessionId),
      [`${userType}Socket`]: socket.id
    });

    socket.emit('joined_chat', { sessionId, status: 'connected' });
  });

  // Handle real-time messages
  socket.on('send_message', async (data) => {
    try {
      const { sessionId, message, messageType = 'text' } = data;
      
      // Broadcast message to all users in the chat room
      socket.to(sessionId).emit('new_message', {
        messageId: require('uuid').v4(),
        message,
        messageType,
        sender: data.sender || 'user',
        timestamp: new Date().toISOString()
      });

      // If it's a user message and no agent is present, trigger AI response
      if (data.sender === 'user') {
        const chatInfo = activeChats.get(sessionId);
        if (!chatInfo?.agentSocket) {
          // Process with AI (implement AI response logic)
          setTimeout(() => {
            socket.to(sessionId).emit('new_message', {
              messageId: require('uuid').v4(),
              message: 'Let me help you with that...',
              messageType: 'text',
              sender: 'bot',
              timestamp: new Date().toISOString()
            });
          }, 1000);
        }
      }

    } catch (error) {
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.sessionId).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Agent availability
  socket.on('agent_available', (data) => {
    agentSockets.set(socket.id, { ...data, available: true });
    // Notify waiting chats
    notifyWaitingChats();
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Chat client disconnected:', socket.id);
    
    // Clean up agent socket tracking
    if (agentSockets.has(socket.id)) {
      agentSockets.delete(socket.id);
    }
    
    // Clean up active chats
    for (const [sessionId, chatInfo] of activeChats.entries()) {
      if (chatInfo.userSocket === socket.id || chatInfo.agentSocket === socket.id) {
        activeChats.delete(sessionId);
        break;
      }
    }
  });
});

// Helper function to notify waiting chats
function notifyWaitingChats() {
  // Implementation to notify chats waiting for agents
  console.log('Notifying waiting chats of available agents');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/itinerary', require('./routes/itinerary'));

// Chat routes with rate limiting
app.use('/api/chat', chatLimiter, require('./routes/chat'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running successfully on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Promise Rejection: ${err.message}`);
  process.exit(1);
});

module.exports = { app, io };

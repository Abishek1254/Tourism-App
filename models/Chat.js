const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // For anonymous users
  },
  messages: [{
    id: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      enum: ['user', 'bot', 'agent'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    originalLanguage: {
      type: String,
      default: 'en'
    },
    translatedMessage: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    },
    attachments: [{
      type: String,
      url: String
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'waiting_for_agent', 'with_agent', 'resolved', 'closed'],
    default: 'active'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['booking', 'itinerary', 'technical', 'general', 'complaint'],
    default: 'general'
  },
  language: {
    type: String,
    default: 'en'
  },
  userInfo: {
    name: String,
    email: String,
    phone: String,
    location: String
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  },
  tags: [String],
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    deviceType: String
  }
}, {
  timestamps: true
});

// Indexes for performance
chatSchema.index({ sessionId: 1, 'messages.timestamp': -1 });
chatSchema.index({ userId: 1, status: 1 });
chatSchema.index({ assignedAgent: 1, status: 1 });

module.exports = mongoose.model('Chat', chatSchema);
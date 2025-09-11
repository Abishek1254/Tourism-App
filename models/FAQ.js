const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  keywords: [String],
  category: {
    type: String,
    enum: ['booking', 'itinerary', 'destinations', 'payments', 'technical', 'general'],
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  priority: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

faqSchema.index({ keywords: 1, category: 1, isActive: 1 });

module.exports = mongoose.model('FAQ', faqSchema);

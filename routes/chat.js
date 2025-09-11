const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (no authentication required for chat)
router.post('/initialize', chatController.initializeChat);
router.post('/message', chatController.sendMessage);
router.get('/session/:sessionId/history', chatController.getChatHistory);
router.get('/faq/suggestions', chatController.getFAQSuggestions);

// Protected routes (require authentication)
router.use(protect);

router.post('/session/:sessionId/end', chatController.endChat);

// Agent-only routes
router.post('/session/:sessionId/assign', 
  authorize('admin', 'agent'), 
  chatController.assignAgent
);

// Admin routes for chat management
router.get('/admin/sessions', 
  authorize('admin'), 
  async (req, res) => {
    // Implementation for admin to view all chat sessions
  }
);

router.get('/admin/analytics', 
  authorize('admin'), 
  async (req, res) => {
    // Implementation for chat analytics
  }
);

module.exports = router;

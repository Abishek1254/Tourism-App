const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  updateTourismPreferences,
  addVisitedDestination,
  getPersonalizedRecommendations,
  trackSearch
} = require('../controllers/profileController');

const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Profile management
router.get('/', getProfile);
router.put('/', updateProfile);

// Tourism preferences
router.put('/preferences', updateTourismPreferences);
router.get('/recommendations', getPersonalizedRecommendations);

// Activity tracking
router.post('/visited-destinations', addVisitedDestination);
router.post('/track-search', trackSearch);

module.exports = router;

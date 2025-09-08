const express = require('express');
const router = express.Router();

const {
  generateItinerary,
  getUserItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  submitFeedback
} = require('../controllers/itineraryController');

const {
  itineraryGenerationValidation,
  itineraryUpdateValidation,
  feedbackValidation,
  handleValidationErrors
} = require('../middleware/itineraryValidation');

const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// POST /api/itinerary/generate - Generate new AI-powered itinerary
router.post('/generate', 
  itineraryGenerationValidation, 
  handleValidationErrors, 
  generateItinerary
);

// GET /api/itinerary/my-itineraries - Get user's all itineraries
router.get('/my-itineraries', getUserItineraries);

// GET /api/itinerary/:id - Get specific itinerary details
router.get('/:id', getItinerary);

// PUT /api/itinerary/:id - Update existing itinerary
router.put('/:id', 
  itineraryUpdateValidation, 
  handleValidationErrors, 
  updateItinerary
);

// DELETE /api/itinerary/:id - Delete itinerary
router.delete('/:id', deleteItinerary);

// POST /api/itinerary/:id/feedback - Submit feedback for itinerary
router.post('/:id/feedback', 
  feedbackValidation, 
  handleValidationErrors, 
  submitFeedback
);

module.exports = router;
